import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";

function renderToneBox(
  text: string,
  bg: string,
  border: string,
  color: string,
): string {
  const t = mailTheme;
  const body = escapeHtml(text.trim());
  if (!body) {
    return "";
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 ${t.space[16]}px;background:${bg};border:1px solid ${border};border-radius:${t.radius.md}px;">
  <tr>
    <td style="padding:${t.space[12]}px ${t.space[16]}px;font-family:${t.font.family};font-size:${t.font.size.md}px;line-height:1.5;color:${color};">
      ${body}
    </td>
  </tr>
</table>`;
}

export function renderMailInfoBox(text: string): string {
  const t = mailTheme;
  return renderToneBox(text, t.color.infoBg, t.color.borderGray, t.color.infoText);
}

export function renderMailSuccessBox(text: string): string {
  const t = mailTheme;
  return renderToneBox(text, t.color.successBg, t.color.borderGray, t.color.successText);
}

export function renderMailWarningBox(text: string): string {
  const t = mailTheme;
  return renderToneBox(text, t.color.warningBg, t.color.borderGray, t.color.warningText);
}
