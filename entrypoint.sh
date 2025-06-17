#!/bin/sh

case "$1" in
  api)
    exec bun api
    ;;
  store)
    exec bun store
    ;;
  viewer)
    exec bun viewer
    ;;
  kactor-system)
    exec bun kactor-system
    ;;
  *)
    echo 'Usage: api | store | viewer | kactor-system'
    exit 1
    ;;
esac
