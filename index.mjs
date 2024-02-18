import { html } from 'https://unpkg.com/htm/preact/index.module.js?module'
import { render, Component, createRef } from 'https://unpkg.com/preact@latest?module'
import Outlines from './components/hull.mjs'

class App extends Component {

  constructor(props) {
    super()
    this.windowMin = 0
    this.windowMax = 5
    this.data = createRef()
  }

  componentDidMount() {
    document.addEventListener("scroll", () => this.onScroll())
  }

  async handleDrop(ev) {
    ev.stopPropagation()
    ev.preventDefault()
    const file = ev.dataTransfer.files[0]
    this.buffer = await file.arrayBuffer()
    this.view = new DataView(this.buffer)
    this.renderView()
  }

  handleDragover(ev) {
    ev.stopPropagation()
    ev.preventDefault()
  }

  handleDragleave(ev) {
    ev.stopPropagation()
    ev.preventDefault()
  }

  onScroll() {
    if (document.body.clientHeight - window.scrollY < window.innerHeight * 2) {
      this.windowMin += 2
      this.windowMax += 2
      const data = document.getElementById("data")
      this.renderView(data.querySelector("span:last-of-type"))
    }
    if (window.scrollY < window.innerHeight && this.windowMin > 0) {
      this.windowMin -= 2
      this.windowMax -= 2
      const data = document.getElementById("data")
      console.log(data.querySelector("span:first-of-type"))
      this.renderView(data.querySelector("span:first-of-type"))
    }
  }

  renderView(anchor) {
    const oldOffset = anchor?.offsetTop
    const bytes = []
    // to avoid locking up the browser on large files, we view a window of 2kb at a time.
    // TODO: but this window ought to move around as we scroll
    for (let i = this.windowMin * 1024; i < Math.min(this.view.byteLength, this.windowMax * 1024); i++) {
      bytes.push(html`<span 
        key=${i}
        id=${i.toString(16)}
        class="byte">${this.view.getUint8(i).toString(16).padStart(2, '0')}</span>`)
    }
    this.setState({bytes}, () => {
      if (anchor) {
        console.log("scrollby:", anchor.offsetTop - oldOffset)
        console.log("scrollY:", window.scrollY)
      }
      if (oldOffset !== undefined) window.scroll(0, window.scrollY + (anchor.offsetTop - oldOffset))
    })
  }

  render(props, state) {
    if (state.bytes && this.data.current) {
      return html`<div data-state="loaded">
          <pre ref=${this.data} id="data">
          ${state.bytes}
          <${Outlines} containerElt=${this.data.current}/>
          </pre>
        </div>`
    } else if (state.bytes) {
      setTimeout(() => this.forceUpdate(), 100)
      return html`<div data-state="loaded">
          <pre ref=${this.data} id="data">${state.bytes}</pre>
        </div>`
    } else {
      return html`<div data-state="awaiting"
          onDragover=${ev => this.handleDragover(ev)}
          onDragleave=${ev => this.handleDragleave(ev)}
          onDrop=${ev => this.handleDrop(ev)}
        ><pre>awaiting file</pre></div>`
    }
  }
}

render(html`<${App}/>`, document.body);
