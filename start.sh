#!/bin/bash
while true; do
    if [[ "$1" == "pero" ]]; then
        nohup npx tsx src/word-count/index.ts > pero.log 2>&1 &
        echo $! > pero_pid.txt
    elif [[ "$1" == "meows" ]]; then
        nohup npx tsx src/sprint/index.ts > meows.log 2>&1 &
        echo $! > meows_pid.txt
    fi
    if [ $? -ne 0 ]; then
        echo "Application crashed. Restarting in 5 seconds..."
        sleep 5
    else
        break
    fi
done
