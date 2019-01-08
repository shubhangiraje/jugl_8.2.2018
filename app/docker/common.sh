export COMPOSE_PROJECT_NAME=jugl_app

export COMPOSE_SYS_PROJECT_NAME=`echo "$COMPOSE_PROJECT_NAME" | sed "s/[^_0-9a-z]//g"`

function get_container_id {
    docker ps | grep ${COMPOSE_SYS_PROJECT_NAME}_$1 | awk '{print $1}'
}

function get_container_env {
    docker exec -ti $CONTAINER_ID /bin/sh -c "cat /proc/1/environ" | xargs -0 -I % echo "export %;" | grep -v "HOME="
}
