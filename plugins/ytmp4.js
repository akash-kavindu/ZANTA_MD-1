const { cmd } = require("../command");
const ytdl = require('@distube/ytdl-core'); // ytdl-core හි නවතම, වැඩි දියුණු කළ fork එක
const ffmpeg = require('fluent-ffmpeg');
const { getBuffer, getRandom } = require("../lib/functions"); // ඔබගේ functions.js වෙතින්

// --- Core Helper Function for Download ---
async function downloadYoutube(url, format, zanta, from, mek, reply) {
    if (!ytdl.validateURL(url)) {
        return reply("*Invalid YouTube URL provided.* 🔗");
    }

    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;
        
        reply(`*Starting download:* ${title} 📥`);

        const stream = ytdl(url, {
            filter: format === 'mp4' ? 'audioandvideo' : 'audioonly',
            quality: format === 'mp4' ? 'highestvideo' : 'highestaudio',
            dlChunkSize: 0, // No chunking
        });

        const tempFilePath = `${getRandom('.mp4')}`;
        
        // --- 1. වීඩියෝව/ශ්‍රව්‍යය මුලින්ම Local File එකක් ලෙස Save කරයි ---
        await new Promise((resolve, reject) => {
            stream.pipe(fs.createWriteStream(tempFilePath))
                .on('finish', resolve)
                .on('error', reject);
        });

        if (format === 'mp3') {
            // --- 2. MP3 වෙත convert කරයි ---
            const finalMp3Path = `${getRandom('.mp3')}`;
            
            await new Promise((resolve, reject) => {
                ffmpeg(tempFilePath)
                    .audioBitrate(128)
                    .save(finalMp3Path)
                    .on('end', () => {
                        fs.unlinkSync(tempFilePath); // Temp File එක මකයි
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error('FFmpeg Error:', err.message);
                        reject(new Error("FFmpeg conversion failed."));
                    });
            });
            
            // --- 3. MP3 එක යවයි ---
            const mp3Buffer = fs.readFileSync(finalMp3Path);
            await zanta.sendMessage(from, { audio: mp3Buffer, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: mek });
            fs.unlinkSync(finalMp3Path); // Final File එක මකයි
            reply(`*Download Complete (MP3)!* 🎵✅`);

        } else if (format === 'mp4') {
            // --- 2. MP4 එක යවයි ---
            const videoBuffer = fs.readFileSync(tempFilePath);
            await zanta.sendMessage(from, { video: videoBuffer, caption: `*Download Complete (MP4)!* \n\nTitle: ${title}` }, { quoted: mek });
            fs.unlinkSync(tempFilePath); // Temp File එක මකයි
        }

    } catch (e) {
        console.error("YouTube Download Error:", e);
        reply(`*❌ Download Failed!* \n\n*Reason:* ${e.message}. \n\nThis may be due to age restriction, copyrighted content, or the video being permanently deleted (Status 410).`);
        
        // Fs.unlinkSync errors වළක්වා ගැනීමට
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(finalMp3Path)) fs.unlinkSync(finalMp3Path);
    }
}

// --- $ytmp4 Command (Video Download) ---
cmd(
    {
        pattern: "ytmp4",
        alias: ["vid", "ytvideo"],
        react: "🎞️",
        desc: "Downloads a YouTube video as MP4.",
        category: "download",
        filename: __filename,
    },
    async (zanta, mek, m, { from, reply, q }) => {
        if (!q) return reply("*Please provide a YouTube link.* 🔗");
        await downloadYoutube(q, 'mp4', zanta, from, mek, reply);
    }
);

// --- $ytmp3 Command (Audio Download) ---
cmd(
    {
        pattern: "ytmp3",
        alias: ["audio", "ytaudio"],
        react: "🎶",
        desc: "Downloads a YouTube video as MP3 audio.",
        category: "download",
        filename: __filename,
    },
    async (zanta, mek, m, { from, reply, q }) => {
        if (!q) return reply("*Please provide a YouTube link.* 🔗");
        await downloadYoutube(q, 'mp3', zanta, from, mek, reply);
    }
);
