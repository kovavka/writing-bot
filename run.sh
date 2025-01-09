#!/bin/bash
while true; do
    npx tsx src/index.ts
    if [ $? -ne 0 ]; then
        echo "Application crashed. Restarting in 5 seconds..."
        sleep 5
    else
        break
    fi
done
