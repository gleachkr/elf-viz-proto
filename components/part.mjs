import { html } from 'https://unpkg.com/htm/preact/index.module.js?module'
import { render, Component } from 'https://unpkg.com/preact@latest?module'

export default class Parts extends Component {
  render(props) {
    // Note: the ELF header ends at offset 0x40/0x34, but the end has no width, so the last byte of the elf header is 0x3f/0x33
    const programHeaderEntries = []
    for (let i = 0; i < props.elfData.e_phnum; i++) {
      const start = props.elfData.e_phoff + (props.elfData.e_phentsize * i)
      const left = i % 2 === 0
      programHeaderEntries.push(html`<${Part} left=${left} title="ph${i}" start=${start} end=${start + props.elfData.e_phentsize - 1} containerElt=${props.containerElt}/>`)
    }

    const sectionHeaderEntries = []
    for (let i = 0; i < props.elfData.e_shnum; i++) {
      const start = props.elfData.e_shoff + (props.elfData.e_shentsize * i)
      const left = i % 2 === 0
      programHeaderEntries.push(html`<${Part} left=${left} title="sh${i}" start=${start} end=${start + props.elfData.e_phentsize - 1} containerElt=${props.containerElt}/>`)
    }

    return html`<svg>
      <${Part} title=${"ELF header"} depth=${1} start=${0x0} end=${props.elfData.is64Bit ? 0x3f : 0x33} containerElt=${props.containerElt} />
      <${Part} title=${"Program header"} depth=${1} start=${props.elfData.e_phoff} end=${props.elfData.e_phoff + (props.elfData.e_phentsize * props.elfData.e_phnum) - 1} containerElt=${props.containerElt} />
      ${programHeaderEntries}
      <${Part} title=${"Section header"} depth=${1} start=${props.elfData.e_shoff} end=${props.elfData.e_shoff + (props.elfData.e_shentsize * props.elfData.e_shnum) - 1} containerElt=${props.containerElt} />
      ${sectionHeaderEntries}
    </svg>`
  }
}

class Part extends Component {
  constructor() {
    super()
    this.state = { active: false }
    this.startInView = false;
    this.endInView = false;
  }

  componentDidUpdate() {

    if (!this.startInView && document.getElementById(this.props.start.toString(16))) {
      this.forceUpdate()
    }

    if (!this.endInView && document.getElementById(this.props.end.toString(16))) {
      this.forceUpdate()
    }

    this.startInView = !!document.getElementById(this.props.start.toString(16))
    this.endInView = !!document.getElementById(this.props.end.toString(16))
  }

  render(props, state) {
    const el1 = document.getElementById(props.start.toString(16))
    const el2 = document.getElementById(props.end.toString(16))

    // bail out if first element is later than the last element of the
    // container, or if last element is before the first element of the
    // container. XXX: this entangles the DOM too much.
    if (!el1) {
      const last = props.containerElt.querySelector("span:last-of-type")
      if (last.id.toString(16) < props.start.toString(16)) return
    }
    if (!el2) {
      const first = props.containerElt.querySelector("span:first-of-type")
      if (first.id.toString(16) > props.start.toString(16)) return
    }

    const container = props.containerElt.getBoundingClientRect()
    const rect1 = el1?.getBoundingClientRect()
    if (rect1) {
      rect1.x -= container.x
      rect1.y -= container.y
    }
    const rect2 = el2?.getBoundingClientRect()
    if (rect2) {
      rect2.x -= container.x
      rect2.y -= container.y
    }
    return html`
      <${Gutter}
        onMouseOver=${() => this.setState({ active: true })}
        onMouseOut=${() => this.setState({ active: false })}
        depth=${props.depth}
        container=${container}
        top=${el1 && rect1.y}
        bottom=${el2 && rect2.bottom - 5}
        left=${props.left ?? true}/>
      ${el1 && el2 && html`<${Outline} title=${props.title} active=${state.active} container=${container} rect1=${rect1} rect2=${rect2}/>`}`
  }

}

// An outline traverses this shape, with waypoints indicated:
//
//                  v1────v2
//                  │      │
// v7───────────────v8     │
// │                       │
// │      v4──────────────v3
// │       │
// v6─────v5
//
// The waypoints are calculated on the basis of a container rect, and two
// other client rects, one of which has v1 for its upper left, and one of which
// has v5 for its lower right. The right side of the outline is the right edge
// of the container (unless second client rect is on the same line as the first)
// and the left edge of the outline is the left edge of the container (unless
// the second client rect is on the same line as the first)

class Outline extends Component {

  render(props) {

    const container = props.container
    const ymin = 0
    const ymax = document.documentElement.scrollHeight
    const rect1 = props.rect1 || new DOMRect(0, ymin, container.width, 0)
    const rect2 = props.rect2 || new DOMRect(0, ymax, container.width, 0)

    const v1 = { x: rect1.x, y: rect1.y }
    const v2 = { y: rect1.y }
    const v3 = { y: rect2.y - 5 }
    const v4 = { x: rect2.right, y: rect2.y - 5 }
    const v5 = { x: rect2.right, y: rect2.bottom - 5 }
    const v6 = { y: rect2.bottom - 5 }
    const v7 = { y: rect1.bottom }
    const v8 = { x: rect1.x, y: rect1.bottom }
    if (rect1.top == rect2.top) {
      v2.x = rect2.right
      v3.x = rect2.right
      v6.x = rect2.x
      v7.x = rect2.x
    } else {
      v2.x = container.width
      v3.x = container.width
      v6.x = 0
      v7.x = 0
    }
    return html`
      <path fill="transparent" 
        stroke=${props.active ? "black" : "transparent"} 
        d="M ${v1.x} ${v1.y} H ${v2.x} V ${v3.y} H ${v4.x} V ${v5.y} H ${v6.x} V ${v7.y} H ${v8.x} V ${v1.y}"/>
      <foreignObject 
        x=${v1.x + 5} 
        y=${v1.y - 10} 
        height="1.2em" 
        width="200">
        <span 
          style="display:${props.active ? "inline" : "none"};background:white;font-size:10px">
            ${props.title}
        </span>
      </foreignObject>
    `
  }
}

class Gutter extends Component {
  render(props) {
    if (!props.bottom && !props.top) return
    const depthPx = ((props.depth + 1) * 7) || 5
    const originX = props.left ? -depthPx : props.container.width + depthPx
    const outerX = props.left ? originX - 5 : originX + 5
    const ymin = props.top || 0
    const ymax = props.bottom || document.documentElement.scrollHeight
    return html`<path 
      onClick=${props.onClick} 
      onMouseOut=${props.onMouseOut} 
      onMouseOver=${props.onMouseOver} 
      fill="transparent" 
      stroke="black"
      d="M ${originX} ${ymin} H ${outerX} V ${ymax} H ${originX}"/>`
  }
}
