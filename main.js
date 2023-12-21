import { createApp, ref } from 'vue'
import { createVuetify } from "vuetify"
import { llm_generate, get_related } from "ollama_client"

const model = "mistral"
const ollama_url = "http://localhost:11434/api/generate"


function parse_related(related) {
    let lines = related.split("\n")
    let result = []
    for (let idx = 0; idx < lines.length; idx++) {
        let line = lines[idx].trim()
        if ((line[0] != "*") || (line.length < 5)) {
            continue
        }
        line = line.slice(1).trim()
        if (line.length == 0) {
            continue
        }
        result.push(line)
    }
    return result
}


function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}


let appState = {
  template: "#app-template",
  setup() {
    let message = ref('Hello Vue!')
    let user_prompt = ref("")
    let prompt_prev = ref("")
    let response = ref("")
    let count = ref(0)
    let related = ref([])
    let last_query = ""

    let trigger_next = (query, real) => {
        console.log(`query ${query}, real ${real}`)
        response.value = ""
        prompt_prev.value = `Generating for: ${query}`
        last_query = query
        related.value = []
        if (real != null) {
            query = real
        }
        llm_generate(query, set_response)
    }

    let handle_prompt_enter = (evt) => {
        trigger_next(user_prompt.value, null)
    }

    let set_related = (msg) => {
        related.value = parse_related(msg)
    }

    let handle_related_click = (msg) => {
        let real = null
        if (last_query.length > 0) {
            real = `In the context of "${last_query}", elaborate on "${msg}"`
        }
        trigger_next(msg, real)
    }
    
    let handle_explore_more = (evt) => {
        let msg = getSelectionText().trim()
        if (msg.length == 0) {
            return
        }
        handle_related_click(msg)
    }

    let set_response = (msg) => {
        msg = msg.replace(/(?:\r\n|\r|\n)/g, '<br>')
        response.value = msg
        prompt_prev.value = last_query
        user_prompt.value = ""
        related.value = ""
        get_related(prompt_prev.value, msg, set_related)
    }

    return {
      count,
      prompt_prev,
      user_prompt,
      message,
      response,
      related,
      handle_prompt_enter,
      handle_related_click,
      handle_explore_more,
    }
  }
}


export function main() {
    const vuetify = createVuetify()
    createApp(appState).use(vuetify).mount('#app')
}
