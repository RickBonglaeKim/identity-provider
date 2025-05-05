#!/bin/sh

ENV=dev
MAIN_SCHEMA=main

DRIZZLE_PATH=./.drizzle/${ENV}
DRIZZLE_DATABASE_PATH=${DRIZZLE_PATH}/database
CONFIG_PATH=./libs/persistence/drizzle-config/${ENV}
SOURCE_PATH=./libs/persistence/database-schema

rm -rf ${SOURCE_PATH}


mkdir -p ${SOURCE_PATH}/${MAIN_SCHEMA}
npx drizzle-kit pull --config ${CONFIG_PATH}/drizzle.config.${ENV}.${MAIN_SCHEMA}.ts
cp ${DRIZZLE_DATABASE_PATH}/${MAIN_SCHEMA}/schema.ts ${DRIZZLE_DATABASE_PATH}/${MAIN_SCHEMA}/relations.ts ${SOURCE_PATH}/${MAIN_SCHEMA}