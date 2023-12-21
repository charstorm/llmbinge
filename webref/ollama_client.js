
const model = "mistral"
const ollama_url = "http://localhost:11434/api/generate"

function post_stream(url, data) {
    let post_params = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }
    return fetch(url, post_params)
}

export async function llm_generate(text, on_success) {
    const data = {
        prompt: text,
        model: model,
        stream: true,
        options: {
            seed: Math.floor(Math.random() * 10000)
        }
    }
    let chunks = []
    const response = await post_stream(ollama_url, data)
    const reader = response.body.getReader()
    let done = false
    while (true) {
        let chunk = await reader.read()
        done = chunk.done
        if (done) {
            break
        }
        if (!chunk.value) {
            continue
        }
        let decoder = new TextDecoder("utf-8")
        let data = decoder.decode(chunk.value)
        let obj = null
        try {
            obj = JSON.parse(data)
        } catch(e) {
            console.log("ERROR: json parse error")
            continue
        }
        if ((obj != null) && (obj.response != null)) {
            chunks.push(obj.response)
        }
    }
    on_success(chunks.join(""))
}

export function get_related(query, response, on_success) {
    const related_query = `
    Based on the following query and response, give a bullet list of
    topics to explore further.

    Query: ${query}

    Response: ${response}

    Output format required:
    -- output --
    * topic1
    * topic2
    * so on
    --

    Only names are required for topics.
    `
    llm_generate(related_query, on_success)
}

