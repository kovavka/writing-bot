#!/bin/bash

if [[ "$1" == "pero" ]] && [ -f ./pero_pid.txt ]; then
    kill `cat pero_pid.txt`
    kill -9 `cat pero_pid.txt`
    rm pero_pid.txt
elif [[ "$1" == "meows" ]]; then
    kill `cat meows_pid.txt`
    kill -9 `cat meows_pid.txt`
    rm meows_pid.txt
fi
