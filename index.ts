import { GuildMember, MessageAttachment } from "discord.js";
import { createCanvas, loadImage, CanvasRenderingContext2D, Canvas } from 'canvas';
import path from 'path';

export interface Theme {
    name: string;
    color: string;
    image: string;
}
export type ThemeType = 'dark' | 'sakura' | 'blue' | 'bamboo' | 'desert' | 'code';

const themes: Theme[] = [
    { name: 'dark', color: '#ffffff', image: 'dark.png' },
    { name: 'sakura', color: '#7d0b2b', image: 'sakura.png' },
    { name: 'blue', color: '#040f57', image: 'blue.png' },
    { name: 'bamboo', color: '#137a0d', image: 'bamboo.png' },
    { name: 'desert', color: '#000000', image: 'desert.png' },
    { name: 'code', color: '#ffffff', image: 'code.png' },
]


function theme2Img(theme: string) {
    let canvasTheme = themes.find(t => t.name === theme)
    //if (!canvasTheme) throw 'Invalid theme! Use: ' + themeArray.map(v => v.name).join(' | ');

    if (canvasTheme) return loadImage(path.join(__dirname, 'images', canvasTheme.image))
    else {
        return loadImage(theme)
    }
}

function getFontSize(str: string) {
    if (str.length >= 19) return 28;
    if (str.length >= 24) return 22;
    if (str.length >= 29) return 18;

    return 35
}






export const modules = {
    welcomeText: (ctx, canvas: Canvas, member: GuildMember) => {
        ctx.font = '30px sans-serif';
        ctx.fillText(`Welcome to this server,`, canvas.width / 2.7, canvas.height / 3.5);
    },

    goodbyeText: (ctx: CanvasRenderingContext2D, canvas: Canvas, member: GuildMember) => {
        ctx.font = '30px sans-serif';
        ctx.fillText(`Goodbye,`, canvas.width / 2.7, canvas.height / 3.5);
    },

    userText: (ctx: CanvasRenderingContext2D, canvas: Canvas, member: GuildMember) => {
        ctx.font = `${getFontSize(member.user.tag)}px sans-serif`
        ctx.fillText(`${member.user.tag}!`, canvas.width / 2.7, canvas.height / 1.8);
    },

    memberCount: (ctx: CanvasRenderingContext2D, canvas: Canvas, member: GuildMember) => {
        ctx.font = '24px sans-serif'
        ctx.fillText(`MemberCount: ${member.guild.memberCount}`, canvas.width / 2.7, canvas.height / 1.3);
    },

    avatarImg: async (ctx: CanvasRenderingContext2D, canvas: Canvas, member: GuildMember) => {
        ctx.lineWidth = 6
        ctx.beginPath();
        ctx.arc(canvas.height / 2, canvas.height / 2, canvas.height / 2.5, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(await loadImage(member.user.displayAvatarURL({ format: 'png' })), 25, 25, 200, 200)
    }
}

export type ModuleFunction = (ctx: CanvasRenderingContext2D, canvas: Canvas, member: GuildMember) => any
export type Module = (keyof typeof modules) | (ModuleFunction)



export async function drawCard(theme: ThemeType = 'sakura', member: GuildMember, mods: Module[]) {
    const canvasTheme = themes.find(t => t.name === theme.toLowerCase())
    if (!canvasTheme) throw 'Invalid theme, Use: ' + themes.map(v => v.name).join(' | ');

    const canvas = createCanvas(700, 250)
    const ctx = canvas.getContext('2d')

    const background = await theme2Img(theme);

    ctx.drawImage(background, 0, 0)
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = canvasTheme.color;
    ctx.strokeStyle = canvasTheme.color;

    for (const mod of mods) {
        if (typeof mod === 'string') {
            var func = modules[mod];
            if (!func) throw new Error(`${mod}, is not a valid Module`);
            await func(ctx, canvas, member)
        } else {
            if (typeof mod === 'function') await mod(ctx, canvas, member);
            else throw (new Error(`${mod}, is not a valid Module`));
        }
    }

    return canvas;
}


export async function welcomeImage(member: GuildMember, theme: ThemeType = 'sakura') {
    const canvas = await drawCard(theme, member, ['welcomeText', 'userText', 'memberCount', 'avatarImg'])

    return new MessageAttachment(canvas.toBuffer(), 'welcome.png')
}


export async function goodbyeImage(member: GuildMember, theme: ThemeType = 'sakura') {
    const canvas = await drawCard(theme, member, ['goodbyeText', 'userText', 'avatarImg'])

    return new MessageAttachment(canvas.toBuffer(), 'goodbye.png')
}