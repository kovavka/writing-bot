#!/bin/bash

if [[ "$1" == "pero" ]]; then
    source ./stop.sh pero
    source ./start.sh pero
elif [[ "$1" == "meows" ]]; then
    source ./stop.sh meows
    source ./start.sh meows
fi
