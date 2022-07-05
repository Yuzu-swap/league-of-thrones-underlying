#!/bin/bash
ProjectDir="$(pwd)"
CsvOutputDir="$ProjectDir/.jsonoutput"
ScriptDir=$(dirname "$0")
#ScriptDir=$(cd $(dirname "$0"); pwd)

# clean output
rm -rf ${CsvOutputDir}
mkdir -p ${CsvOutputDir}

echo "start to convert csv files"
for file in `ls *.csv`
do	
	lua ${ScriptDir}/SerializeGDSToFile.lua ${ProjectDir}/${file} ${CsvOutputDir} ${file}
done

echo finish