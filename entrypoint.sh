#!/bin/sh

case "$1" in
  api)
    exec node api.ts
    ;;
  store)
    exec node store.ts
    ;;
  viewer)
    exec node viewer.ts
    ;;
  kactor-system)
    exec node kactor-system.ts
    ;;
  *)
    echo 'Usage: api | store | viewer | kactor-system'
    exit 1
    ;;
esac
