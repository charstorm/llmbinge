
// const model = "llama2"
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


export async function llm_generate(text, push_text=null) {
    const data = {
        prompt: text,
        model: model,
        stream: true,
        options: {
            seed: Math.floor(Math.random() * 10000)
        }
    }
    const response = await post_stream(ollama_url, data)
    const reader = response.body.getReader()
    let chunks = []
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
            if (push_text != null) {
                push_text(obj.response)
            }
        }
    }
    return chunks.join("")
}


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


function get_all_lines(data) {
    let parts = data.split("\n")
    let remaining = ""
    if (data.endsWith("\n")) {
        parts.pop()
    } else {
        remaining = parts.pop()
    }
    return [parts, remaining]
}


export async function get_related(query, response, inc_update) {
    const related_query = `
    Based on the following query and response, give suggestions for
    topics to explore further.

    Query: ${query}

    Response: ${response}

    Only produce 10 most relevant topics in the following output format.
    It should be a bullet list of topics. Each topic should be short.
    -- output format start --
    * topic1 (just a name or a phrase)
    * topic2 (just a name or a phrase)
    * so on
    -- output format end --
    `
    // let llm_output = await llm_generate(related_query)
    // let related = parse_related(llm_output)
    // return related
    let lines_added = 0
    let rem = ""
    let full_text = ""

    let send_update = (line) => {
        line = line.trim()
        if (!line.startsWith("*") && !line.startsWith("•")) {
            return
        }
        line = line.substr(1).trim()
        if (line.length > 3) {
            inc_update(line)
            lines_added++
        }
    }

    await llm_generate(related_query, (text) => {
        rem += text
        full_text += text
        let [splits, remaining] = get_all_lines(rem)
        for (let idx = 0; idx < splits.length; idx++) {
            let part = splits[idx]
            send_update(part)
        }
        rem = remaining
    })
    send_update(rem)
    // Nasty hack
    // Sometimes we don't get output in the format we want. So try again.
    if (lines_added == 0) {
        console.log("WARNING: No lines found!")
        console.log(full_text)
        await get_related(query, response, inc_update)
    }
}

export async function llm_get_aspect_query(title, aspect) {
    const prefix = "Query-rephrased:"
    const aspect_query = `
    Agressively simplify and rephrase the query given below.
    Do not ask for further clarification.
    Do not include extra information other what is in the query.

    Query: In the context of "${title}", elaborate on the aspect "${aspect}"

    Output should be of the following format:
    --- format ---
    Query: same as the above one
    Topic: topic of the query
    Aspect: what is the aspect of discussion
    ${prefix} simplified query
    ---
    `.trim()

    let response = await llm_generate(aspect_query)
    let lines = response.split("\n")
    let result = ""
    let prefix_lower = prefix.toLowerCase()
    for (let idx = 0; idx < lines.length; idx++) {
        let line = lines[idx].trim()
        if (line.toLowerCase().startsWith(prefix_lower)) {
            result = line.slice(prefix.length).trim()
        }
    }
    return result
}
