#!/bin/bash
while true; do
    node bot.js
    if [ $? -ne 0 ]; then
        echo "Application crashed. Restarting in 5 seconds..."
        sleep 5
    else
        break
    fi
done
