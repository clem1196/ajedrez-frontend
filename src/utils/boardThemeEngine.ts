// src/utils/boardThemeEngine.ts

export function createBoardBackground(light: string, dark: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges">
<g id="a">
  <g id="b">
    <g id="c">
      <g id="d">
        <rect width="1" height="1" fill="${light}" id="e"/>
        <use x="1" y="1" href="#e"/>
        <rect y="1" width="1" height="1" fill="${dark}" id="f"/>
        <use x="1" y="-1" href="#f"/>
      </g>
      <use x="2" href="#d"/>
    </g>
    <use x="4" href="#c"/>
  </g>
  <use y="2" href="#b"/>
</g>
<use y="4" href="#a"/>
</svg>`;

    // 💡 Quita 'charset=utf-8,' para que la cadena data URI sea estándar y válida
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}