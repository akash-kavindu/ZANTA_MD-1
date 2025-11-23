const { cmd } = require("../command");

cmd(
    {
        pattern: "save",
        react: "✅",
        desc: "Resend Status or One-Time View Media (Simplified)",
        category: "general",
        filename: __filename,
    },
    async (
        zanta,
        mek,
        m,
        {
            from,
            quoted,
            reply,
        }
    ) => {
        try {
            // 1. Reply කර තිබේදැයි පරීක්ෂා කිරීම
            if (!quoted) {
                return reply("*කරුණාකර ඔබට save කර ගැනීමට අවශ්‍ය Status/Media Message එකකට reply කරන්න!* 🧐");
            }

            // 2. Media Content Container එක ලබා ගැනීම
            // Status, OTV, සහ සාමාන්‍ය Media සඳහා සත්‍ය content එක බොහෝ විට containedMessage හෝ fakeObj තුළ ඇත.
            // අපි සත්‍ය media data එක තියෙන object එක සොයා ගනිමු.
            let mediaMessage = quoted.fakeObj;
            
            // 3. Media Data එකක් තිබේදැයි තහවුරු කිරීම
            if (!mediaMessage) {
                // quoted.fakeObj නැතිනම්, එය සැබෑ media message එකක් නොවේ.
                return reply("*⚠️ Media Content එක හඳුනාගැනීමට නොහැකි විය. එය photo/video Status එකක් බවට සහතික වන්න!*");
            }
            
            // 4. Media Type එක තීරණය කිරීම සහ Caption එක සැකසීම
            let saveCaption = "*💾 Saved and Resent!*";

            if (quoted.isStatus) {
                saveCaption = "*✅ Status Media Saved!*";
            } else if (quoted.isViewOnce) {
                 saveCaption = "*📸 One-Time View Saved!*";
            }
            
            // 5. Media එක Copy කර Forward කිරීම
            // zanta.copyNForward මගින් mediaMessage එකේ ඇති image, video හෝ වෙනත් media type එක ස්වයංක්‍රීයව හඳුනාගෙන යවයි.
            await zanta.copyNForward(from, mediaMessage, {
                caption: saveCaption,
                quoted: mek // 'save' command එකට reply කරමින් යැවීම
            });

            return reply("*Media successfully processed and resent!* ✨");

        } catch (e) {
            console.error(e);
            reply(`*Error saving media:* ${e.message || e}`);
        }
    }
);
