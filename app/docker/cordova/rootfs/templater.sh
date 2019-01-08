#/bin/bash

ENV=${ENV:-DEBUG}

function PD {
    if [ "$ENV" == "PROD" ]
    then
        echo $1
    else
        echo $2
    fi
}

for dir in $@
do
    for file in `find $dir -name "*.tpl"`
    do
        echo "processing template $file"
        destfile=`echo "$file" | sed "s/\.tpl\$//"`
        template=`cat $file | sed -e 's/"/\\\\"/g' -e "s/\(\\$[^{\(]\)/\\\\\\\\\\1/g"`
        eval "echo \"${template}\" >$destfile"
        rm $file
    done
done
