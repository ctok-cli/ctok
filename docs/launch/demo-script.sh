#!/usr/bin/env bash
# Recording script for the README hero asciinema cast.
# Run via: asciinema rec docs/launch/demo.cast --idle-time-limit 1.5 -c "bash docs/launch/demo-script.sh"
# Total runtime: ~14 seconds. Keep it tight.

set -e

clear
sleep 0.5

# 1. Quick install hint
echo '$ npm install -g @ctok/cli'
sleep 1.5

# 2. Estimate
echo
echo '$ ctok check "Refactor the auth module to use JWT"'
sleep 0.8
ctok check "Refactor the auth module to use JWT" || true
sleep 2.5

# 3. The viral hook
echo
echo '$ ctok refine --diff "please can you kindly help me handle the auth thing somehow"'
sleep 0.8
ctok refine --diff "please can you kindly help me handle the auth thing somehow" || true
sleep 3.5

# 4. Outro
echo
echo '$ # Lighthouse for Claude prompts. MIT. ctok.dev'
sleep 2
