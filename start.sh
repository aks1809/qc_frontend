#!/bin/bash
pm2-runtime "serve -s build"
wait -n  
exit $?