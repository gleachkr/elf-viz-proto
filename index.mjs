import { html } from 'https://unpkg.com/htm/preact/index.module.js?module'
import { render, Component } from 'https://unpkg.com/preact@latest?module'

class App extends Component {

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

  renderView() {
    const bytes = []
    for (let i = 0; i < this.view.byteLength; i++) {
      bytes.push(html`<span class="byte">${this.view.getUint8(i).toString(16).padStart(2,'0')}</span>`)
    }
    this.setState({bytes})
  }

  render(props,state) {
    if (state.bytes) {
      return html`<pre 
        data-state="loaded"
        >${state.bytes}</pre>`
    } else {
      return html`<pre 
        onDragover=${ev => this.handleDragover(ev)}
        onDragleave=${ev => this.handleDragleave(ev)}
        onDrop=${ev => this.handleDrop(ev)}
        data-state="awaiting"
        >awaiting file</pre>`
    }
  }
}

render(html`<${App}/>`, document.body);
