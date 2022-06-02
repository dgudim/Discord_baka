import { ICommand } from "wokcommands";
import { getFileName, getLastFile, getLastTags, isUrl, perc2color, sendToChannel, setLastTags, tagContainer } from "../utils";
import sagiri from "sagiri";
import { MessageEmbed, TextBasedChannel } from "discord.js";
const Danbooru = require('danbooru')
const booru = new Danbooru()

const sagiri_client = sagiri("d78bfeac5505ab0a2af7f19d369029d4f6cd5176");

async function findSauce(file: string, channel: TextBasedChannel | null) {
    const results = await sagiri_client(file);
    let images = 0;
    for (let i = 0; i < results.length; i++) {
        if (results[i].similarity >= 80) {
            images++;
            const embed = new MessageEmbed();
            embed.setTitle(`Result №${i + 1} from saucenao`);
            embed.setColor(perc2color(results[i].similarity));
            embed.setDescription(`similarity: ${results[i].similarity}`);
            embed.setURL(results[i].url);
            embed.setImage(results[i].thumbnail);
            if (results[i].site == 'Danbooru') {
                const post = await booru.posts(+getFileName(results[i].url))
                embed.setFields([{
                    name: "Author",
                    value: post.tag_string_artist || '-'
                },
                {
                    name: "Character",
                    value: post.tag_string_character || '-'
                },
                {
                    name: "Tags",
                    value: post.tag_string_general || '-'
                },
                {
                    name: "Site",
                    value: results[i].site || '-'
                }]);
                if (!isUrl(file) && getLastTags().file != file) {
                    setLastTags(new tagContainer(
                        post.tag_string_character,
                        post.tag_string_artist,
                        post.tag_string_general,
                        file));
                }
            } else {
                embed.setFields([{
                    name: "Author",
                    value: results[i].authorName || '-'
                },
                {
                    name: "Author url",
                    value: results[i].authorUrl || '-'
                },
                {
                    name: "Site",
                    value: results[i].site
                }]);
            }
            channel?.send({
                embeds: [embed]
            });
        }
    }
    if (!images) {
        sendToChannel(channel, "No sauce found :(");
    }
}

export default {
    category: 'Misc',
    description: 'Get sauce of an image',

    slash: 'both',
    testOnly: true,
    ownerOnly: false,
    hidden: false,

    expectedArgs: '<url>',
    expectedArgsTypes: ['STRING'],
    minArgs: 0,
    maxArgs: 1,

    callback: async ({ args, channel }) => {

        if (!args.length) {
            const file = getLastFile();
            if (!file) {
                return "No file provided."
            }
            findSauce(file, channel);
            return `searching sauce for ${getFileName(file)}`;
        }

        if (isUrl(args[0])) {
            findSauce(args[0], channel);
            return `searching sauce for ${getFileName(args[0])}`;
        }

        return "Invalid url."
    }
} as ICommand