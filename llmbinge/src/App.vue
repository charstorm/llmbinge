<template>
  <v-app id="app">
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="3">
            <h3> Generated </h3>
            <ul class="linklist leftbar">
              <li v-for="node in node_list" :key="get_title(node)" class="mt-3">
                <a href="javascript:void(0)"
                   @click="activate_node(node)">
                   {{get_title(node)}}
                </a>
              </li>
            </ul>
          </v-col>
          <v-col cols="9">
            <v-text-field label="Your Query" v-model="user_query"
                          @keyup.enter="handle_user_query" />
            <div v-if="current_node">
              <h4> {{get_title(current_node)}} </h4>
              <div v-html="current_node.description"></div>
              <template v-if="current_node.related.length > 0">
                <h4 class="mt-3"> Related </h4>
                <ul class="linklist">
                  <li v-for="rel in current_node.related" :key="rel">
                    <a href="javascript:void(0)"
                       @click="handle_related(current_node, rel)">
                      {{rel}}
                    </a>
                  </li>
                  <li v-if="!loading" class="mt-3">
                    <a href="javascript:void(0)"
                       @click="handle_related(current_node, null)">
                       Explore Selected Text
                    </a>
                  </li>
                </ul>
                <div v-if="!loading" class="linklist">
                  <h4 class="mt-3"> Aspects </h4>
                  <div class="d-flex flex-wrap">
                    <div class="pr-2" v-for="asp in current_node.aspects">
                      <a href="javascript:void(0)"
                         @click="handle_aspect(current_node, asp)">
                        {{asp}}
                      </a>
                    </div>
                  </div>
                </div>
              </template>
              <template v-if="get_num_explored(current_node) > 0">
                <h4 class="mt-3"> Explored </h4>
                <ul class="linklist">
                  <li v-for="exp in get_explored_as_list(current_node)"
                      :key="exp.title">
                      <a href="javascript:void(0)"
                         @click="activate_node(exp.child)">
                         {{exp.title}}
                      </a>
                  </li>
                </ul>
              </template>
              <div class="linklist mt-2"
                v-if="(current_node.parent_id >= 0) && !loading">
                <h4 class="mt-3"> Parent </h4>
                <a href="javascript:void(0)"
                   @click="activate_node_id(current_node.parent_id)">
                   {{get_title_from_node_id(current_node.parent_id)}}
                </a>
              </div>
            </div>
            <div class="mt-4" v-if="loading">
              <v-progress-circular indeterminate color="green" ></v-progress-circular>
            </div>
          </v-col>
        </v-row>
        <div id="end_of_app" class="mb-2"></div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { llm_generate, get_related, llm_get_aspect_query } from "./ollama_client.js"

function split_remove_minus(data) {
  return data.split(/\s+/)
             .filter(s => s.trim() != "")
             .sort()
}

let node_counter = 0
let node_list = ref([])
let current_node = ref(null)
let visit_history = ref([])
let user_query = ref("")
let busy = false
let loading = ref(false)
let error = ref("")
let aspects = split_remove_minus(`
history related-people locations applications risk saftey
similar-ideas similar-topics related-ideas related-topics
side-effects materials current-practices process production
discovery invention cause effect planning construction
`)

function new_node(parent_id=-1, title="", query="") {
  let node_id = node_counter
  node_counter++
  let node = {
    parent_id: parent_id,
    node_id: node_id,
    title: title,
    query: query,
    description: "",
    related: [],
    explored: [],
    aspects: aspects,
  }
  node_list.value.push(node)
  return node
}


function get_title(node) {
  if (node == null) {
    return ""
  }
  if (node.title != "") {
    return node.title
  }
  return node.query
}


function scroll_into_view(elem_id) {
  let elem = document.getElementById(elem_id)
  if (elem != null) {
    elem.scrollIntoView()
  }
}


async function create_node_fill_description(parent_id, title, query) {
  if (loading.value) {
    return
  }
  current_node.value = null
  loading.value = true
  let node = null
  try {
    node = new_node(parent_id, title, query)
    current_node.value = node
    let combined = ""
    let raw_description = ""
    let text_count = 0
    await llm_generate(query, (text) => {
      raw_description += text
      text = text.replace(/(?:\r\n|\r|\n)/g, '<br>')
      text_count++
      if ((text_count == 1) && (text == "<br>")) {
        return
      }
      combined += text
      current_node.value.description = combined
      // scroll_into_view("end_of_app")
    })
    await get_related(query, raw_description, (rel) => {
      if (get_title(current_node.value).toLowerCase() != rel.toLowerCase()) {
        current_node.value.related.push(rel)
        // scroll_into_view("end_of_app")
      }
    })
  }
  catch (e) {
    console.log(`ERROR: ${e}`)
  }
  loading.value = false
  // setTimeout(() => { scroll_into_view("end_of_app") }, 20)
  return node
}


async function handle_user_query(evt) {
  await create_node_fill_description(-1, "", user_query.value)
  user_query.value = ""
}


function get_selection_text() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}


async function handle_related(node, rel) {
  if (loading.value) {
    return
  }
  if (rel === null) {
    rel = get_selection_text()
    if (rel.trim().length == 0) {
      return
    }
  }
  let parent_title = get_title(node)
  let query = `In the context of "${parent_title}", explain ${rel}`
  let child = await create_node_fill_description(node.node_id, rel, query)
  node.related = node.related.filter(item => item !== rel)
  node.explored.push(child.node_id)
}


function activate_node(node) {
  if (loading.value) {
    return
  }
  current_node.value = node
}


function activate_node_id(node_id) {
  if (node_id < 0) {
    return
  }
  activate_node(node_list.value[node_id])
}


function get_title_from_node_id(node_id) {
  if (node_id < 0) {
    return ""
  }
  return get_title(node_list.value[node_id])
}


function get_num_explored(node) {
   return Object.keys(node.explored).length;
}


function get_explored_as_list(node) {
  let result = []
  for (let idx = 0; idx < node.explored.length; idx++) {
    let child_id = node.explored[idx]
    let child = node_list.value[child_id]
    let title = get_title(child)
    result.push({title, child})
  }
  return result
}


async function handle_aspect(node, aspect) {
  if (loading.value) {
    return
  }
  current_node.value = null
  loading.value = true
  let query = ""
  let parent_title = get_title(node)
  try {
    query = await llm_get_aspect_query(parent_title, aspect)
  }
  catch (e) {
    console.log(`ERROR: ${e}`)
    return
  }
  finally {
    loading.value = false
  }
  if (query == "") {
    return
  }
  let child = await create_node_fill_description(node.node_id, "", query)
  node.aspects = node.aspects.filter(item => item !== aspect)
  node.explored.push(child.node_id)
}

</script>

<style>
#app {
  color: #ddb;
}

h1, h2, h3, h4, h5 {
  color: #eee;
}

.linklist a {
  text-decoration: None;
  color: #8ac;
}

.linklist a:hover {
  cursor: pointer;
}

ul.linklist {
  list-style-type: none;
}

.btn {
  text-transform: unset !important;
}

::-moz-selection { /* Code for Firefox */
  background: #009;
}

::selection {
  background: #009;
}

.leftbar {
  line-height: 1;
}
</style>
