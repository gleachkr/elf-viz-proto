import { html } from 'https://unpkg.com/htm/preact/index.module.js?module'
import { render, Component, createRef } from 'https://unpkg.com/preact@latest?module'
import Parts from './components/part.mjs'
import { makeElfData } from './util/elfdata.mjs'

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
    if (state.bytes) {
      if (!this.data.current) setTimeout(() => this.forceUpdate(), 100)
      return html`<div data-state="loaded">
          <pre ref=${this.data} id="data">
          ${state.bytes}
          ${this.data.current &&
          html`<${Parts} elfData=${this.elfData} containerElt=${this.data.current}/>`
          }
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
