#!/usr/bin/env bash

script_file="$0"
command="$1"

function start_nginx {
    /usr/sbin/nginx -c nginx.conf -p $PWD
}

function start_ngrok {
    # port is defined inside nginx.conf
    ngrok http http://localhost:8101
}

function help {
    echo "Usage: $script_file command [args]"
    echo -e "\nAvailable commands:"
    compgen -A function | sed -e 's/^\([^ ]*\) .*/\1/' -e 's|^|  |g'
}

function_exists() {
    declare -f "$1" > /dev/null
}

if [[ $# -eq 0 ]]; then
    help
else
    if function_exists "$command"; then
        "$command" "$@"  # Call the function with the remaining arguments
    else
        echo "Error: Function '$command' not defined."
        exit 1
    fi
fi
