import { html } from 'https://unpkg.com/htm/preact/index.module.js?module'
import { render, Component, createRef } from 'https://unpkg.com/preact@latest?module'
import Part from './components/part.mjs'
import { makeElfData, makePHData } from './util/elfdata.mjs'

class App extends Component {

  constructor() {
    super()
    this.windowMin = 0
    this.windowMax = 5
    this.data = createRef()
  }

  componentDidMount() {
    document.addEventListener("scroll", () => this.onScroll())
  }

  handleData(buffer) {
    this.buffer = buffer
    this.view = new DataView(this.buffer)
    this.elfData = makeElfData(this.view)
    this.phData = []

    for (let i = 0; i < this.elfData.e_phnum; i++) {
      const offset = this.elfData.e_phoff + (this.elfData.e_phentsize * i)
      const phData = makePHData(this.view,offset)
      phData.number = i
      this.phData.push(phData)
    }

    this.phData.sort((a,b) => a.p_offset - b.p_offset)

    const lanesLeft = []
    const lanesRight = []

    main: for (const phData of this.phData) {
      for (let idx = 0; idx < Math.max(lanesLeft.length, lanesRight.length); idx++) {
        if (idx < lanesLeft.length &&
          lanesLeft[idx].p_offset + lanesLeft[idx].p_filesz + 8 < phData.p_offset) {
          phData.depth = idx
          phData.left = true
          lanesLeft[idx] = phData
          continue main
        }
        if (idx < lanesRight.length &&
          lanesRight[idx].p_offset + lanesRight[idx].p_filesz + 8 < phData.p_offset) {

          phData.depth = idx 
          phData.left = false
          lanesRight[idx] = phData
          continue main
        }
      }
      const leastLane = lanesLeft.length < lanesRight.length 
        ? (phData.left = true, lanesLeft)
        : (phData.left = false, lanesRight)
      phData.depth = leastLane.length
      leastLane.push(phData)
    }

    this.renderView()
  }

  onScroll() {
    if (document.body.clientHeight - window.scrollY < window.innerHeight * 2) {
      const data = document.getElementById("data")
      const anchor = data.querySelector("span:last-of-type")
      if (anchor.dataset.boundary == "last") return
      this.windowMin += 2
      this.windowMax += 2
      this.renderView(anchor)
    }
    if (window.scrollY < window.innerHeight) {
      const data = document.getElementById("data")
      const anchor = data.querySelector("span:first-of-type")
      if (anchor.dataset.boundary == "first") return
      this.windowMin -= 2
      this.windowMax -= 2
      this.renderView(anchor)
    }
  }

  renderView(anchor) {
    const oldOffset = anchor?.offsetTop
    const oldScroll = window.scrollY
    const bytes = []
    // to avoid locking up the browser on large files, we view a window of 2kb at a time.
    for (let i = this.windowMin * 1024; i < Math.min(this.view.byteLength, this.windowMax * 1024); i++) {
      bytes.push(html`<span 
        key=${i}
        id=${i.toString(16)}
        data-boundary=${i == 0 ? "first" : i == this.view.byteLength - 1 ? "last" : null}
        class="byte">${this.view.getUint8(i).toString(16).padStart(2, '0')}</span>`)
    }
    this.setState({ bytes }, () => {
      if (oldOffset !== undefined) window.scroll(0, anchor.offsetTop - oldOffset + oldScroll)
    })
  }

  render(_props, state) {
    const programHeaderEntries = []
    const segments = []
    const sectionHeaderEntries = []

    if (state.bytes) {
      if (!this.data.current) setTimeout(() => this.forceUpdate(), 100)
      else {

        for (let i = 0; i < this.elfData.e_phnum; i++) {
          const start = this.elfData.e_phoff + (this.elfData.e_phentsize * i)
          const left = i % 2 === 0
          programHeaderEntries.push(html`<${Part} 
            left=${left} 
            title="ph${i}"
            key="ph${i}"
            start=${start} 
            end=${start + this.elfData.e_phentsize - 1} 
            containerRef=${this.data}
            />`)
          segments.push(html`<${Part}
            left=${this.phData[i].left} 
            title="segment-${this.phData[i].number}"
            key="seg${this.phData[i].number}"
            start=${this.phData[i].p_offset}
            end=${this.phData[i].p_offset + this.phData[i].p_filesz - 1}
            depth=${2 + this.phData[i].depth } 
            containerRef=${this.data}
            />`)
        }


        for (let i = 0; i < this.elfData.e_shnum; i++) {
          const start = this.elfData.e_shoff + (this.elfData.e_shentsize * i)
          const left = i % 2 === 0
          sectionHeaderEntries.push(html`<${Part} 
            left=${left} 
            title="sh${i}" 
            key="sh${i}"
            start=${start} 
            end=${start + this.elfData.e_shentsize - 1} 
            containerRef=${this.data}
            />`)
        }
      }

      return html`<div data-state="loaded">
          <pre ref=${this.data} id="data">
          ${state.bytes}
          ${this.data.current && html`<svg>
              <${Part} 
                title="ELF header" 
                depth=${1} 
                start=${0x0} 
                end=${this.elfData.is64Bit ? 0x3f : 0x33} 
                containerRef=${this.data} />
              <${Part} 
                title="Program header" 
                depth=${1} 
                start=${this.elfData.e_phoff} 
                end=${this.elfData.e_phoff + (this.elfData.e_phentsize * this.elfData.e_phnum) - 1} 
                containerRef=${this.data} />
              ${programHeaderEntries}
              ${segments}
              <${Part} 
                title="Section header" depth=${1} 
                start=${this.elfData.e_shoff} 
                end=${this.elfData.e_shoff + (this.elfData.e_shentsize * this.elfData.e_shnum) - 1} 
                containerRef=${this.data} />
              ${sectionHeaderEntries}
            </svg>`}
          </pre>
        </div>`
    } else {
      return html`<${Uploader} handleData=${data => this.handleData(data)} />`
    }
  }
}

class Uploader extends Component {
  async handleDrop(ev) {
    ev.stopPropagation()
    ev.preventDefault()
    const file = ev.dataTransfer.files[0]
    const buffer = await file.arrayBuffer()
    this.props.handleData(buffer)
  }

  handleDragover(ev) {
    ev.stopPropagation()
    ev.preventDefault()
  }

  handleDragleave(ev) {
    ev.stopPropagation()
    ev.preventDefault()
  }
  render() {
    return html`<div data-state="awaiting"
          onDragover=${ev => this.handleDragover(ev)}
          onDragleave=${ev => this.handleDragleave(ev)}
          onDrop=${ev => this.handleDrop(ev)}
        ><pre>awaiting file</pre></div>`
  }
}

render(html`<${App}/>`, document.body);
