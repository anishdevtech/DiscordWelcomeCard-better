import { Timer, toImage, roundRect, changeFontSize, getFontSize } from '@discord-card/core';
import { createCanvas } from 'canvas';
import { themes, snap } from '../lib';
import { CardOptions, TextAlign } from '../types';

const w = 700,
  h = 250;

export async function drawCard(options: CardOptions): Promise<Buffer> {
  const timer = {
    step: (...args: any[]) => {},
    stop: (...args: any[]) => {},
  };

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  timer.step('created Canvas');

  let theme: Theme;

  options.card ??= {};
  options.card.border ??= true;
  options.card.rounded ??= true;
  options.card.blur ??= true;

  options.avatar ??= {};
  options.avatar.imageRadius ??= 0.8;

  //Parsing the Theme
  if (typeof (options.theme ?? 'code') === 'string') {
    theme = themes[options.theme ?? 'code'];
    if (!theme) throw new Error('Invalid theme, use: ' + Object.keys(themes).join(' | '));
  } else throw new Error('Invalid theme, use: ' + Object.keys(themes).join(' | '));

  ctx.drawImage(await staticCard(options), 0, 0, w, h);

  timer.step('add static');

  //Setting Styles
  ctx.fillStyle = (options.text?.color ?? theme.color).toString(ctx);
  ctx.font = '30px ' + (options.text?.font ?? theme.font ?? 'SegoeUI') + ', SegoeUI, SegoeUIEmoji';

  // Apply text alignment
  const textAlign: TextAlign = options.text?.align ?? 'left'; // Default to 'left' if not provided
  ctx.textAlign = textAlign;

  // Apply text color
  ctx.fillStyle = options.text?.color ?? theme.color;

  //Drawing
  //Title
  if (options.text?.title) {
    const txt = options.text!.title;
    if (typeof txt === 'string') {
      changeFontSize(ctx, '30px').fillText(txt, w / 2.7, h / 3.5);
    } else txt.draw(canvas); //instanceof Text
  }

  //Text
  if (options.text?.text) {
    const txt = options.text!.text;
    if (typeof txt === 'string') {
      changeFontSize(ctx, getFontSize(txt) + 'px').fillText(txt, w / 2.7, h / 1.8);
    } else txt.draw(canvas); //instanceof Text
  }

  //Subtitle
  if (options.text?.subtitle) {
    const txt = options.text!.subtitle;
    if (typeof txt === 'string') {
      changeFontSize(ctx, '25px').fillText(txt, w / 2.7, h / 1.3);
    } else txt.draw(canvas); //instanceof Text
  }

  timer.step('text');

  //Avatar Image
  const radius = (h / 2) * (options.avatar?.imageRadius ?? 0.8);
  const avatarAlign: 'left' | 'center' | 'right' = options.avatar?.align ?? 'left';

  let avatarX = 0;
  if (avatarAlign === 'center') {
    avatarX = (w - radius * 2) / 2;
  } else if (avatarAlign === 'right') {
    avatarX = w - radius * 2;
  }

  function applyShape(offset = 0) {
    if (options.avatar?.borderRadius) {
      roundRect(
        ctx,
        avatarX - offset,
        h / 2 - radius - offset,
        radius * 2 + 2 * offset,
        radius * 2 + 2 * offset,
        options.avatar.borderRadius * radius
      );
    } else {
      ctx.beginPath();
      ctx.arc(avatarX + radius, h / 2, radius + offset, 0, Math.PI * 2, true);
      ctx.closePath();
    }
    return ctx;
  }

  const { avatar } = options;
  if (avatar) {
    const avatarImage = avatar.image;
    const outlineWidth = avatar.outlineWidth ?? 0;
    if (avatarImage) {
      applyShape(-outlineWidth).clip();
      ctx.drawImage(
        await toImage(avatarImage),
        avatarX + (avatar.outlineWidth ?? 0),
        h / 2 - radius + (avatar.outlineWidth ?? 0),
        radius * 2 - (avatar.outlineWidth ?? 0) * 2,
        radius * 2 - (avatar.outlineWidth ?? 0) * 2
      );
    }
  }

  timer.step('avatar');

  snap(canvas);

  const buff = canvas.toBuffer(options.generation?.format ?? ('image/png' as any));

  timer.step('buffer');
  timer.stop();

  return buff;
}
