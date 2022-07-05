
-- ****** 公共方法支持 开始 ******
function stringSplit(str, delimiter)
    if (delimiter == '') then return false end
    local pos, arr = 0, {}
    for st, sp in function() return string.find(str, delimiter, pos, true) end do
    	local sub_str = string.sub(str, pos, st - 1) 
    	if string.byte(sub_str, string.len(sub_str)) == 13 then -- 有一个  该死的垂直制表符，什么东西啊 
    		sub_str = string.sub(sub_str, 1, string.len(sub_str) - 1) 
    	end 
        table.insert(arr, sub_str)
        pos = sp + 1
    end
    
    table.insert(arr, string.sub(str, pos))

    return arr
end
-- ****** 公共方法支持 结束 ******


-- ****** 解析GDS用的 ******
local currentParseName = ""
	-- 初始化GDS文件的的方法
function GdsInitCallback(name, data)
	currentParseName = name

    local splitStr = "\n" -- 这里在Windows下可能会有问题
    
    lines = stringSplit(data, splitStr)

	local fieldNames = {}
	local fieldTypes = {}
	local fieldDesc = {}

	fieldTypes = _ParseFieldTypes(_ParseCSVLine(lines[2]))
	fieldNames = _ParseFieldNames(_ParseCSVLine(lines[1]), fieldTypes)
	-- 注释不用解析

	fieldDesc = _ParseFieldDesc(_ParseCSVLine(lines[3]))
	_ParseKeys(_ParseCSVLine(lines[4]), fieldTypes)

	local config = {}
	for i=6, #lines do
		local line = lines[i]
		if line ~= "" and line ~= nil then
			
			local fields = _ParseCSVLine(line)
			-- handle data line
			local key, oneLineConfig = _ParseFields(fields, fieldNames, fieldTypes)

			if key ~= nil then
				config[key] = oneLineConfig
			end
		end
	end

	return config
end

function _ParseCSVLine(s)
	s = s .. ','        -- ending comma
	local t = {}        -- table to collect fields
	local fieldstart = 1
	repeat
	  	-- next field is quoted? (start with `"'?)
	  	if string.find(s, '^"', fieldstart) then
			local a, c
			local i  = fieldstart
			repeat
		  	-- find closing quote
		  	a, i, c = string.find(s, '"("?)', i+1)
			until c ~= '"'    -- quote not followed by quote?
			if not i then error( currentParseName .." 文件解析错误，注释中的引号不配对!" .. string.sub(s, fieldstart)) end
			local f = string.sub(s, fieldstart+1, i-1)
			table.insert(t, (string.gsub(f, '""', '"')))
			fieldstart = string.find(s, ',', i) + 1
		else                -- unquoted; find next comma
			local nexti = string.find(s, ',', fieldstart)
			table.insert(t, string.sub(s, fieldstart, nexti-1))
			fieldstart = nexti + 1
		end
	until fieldstart > string.len(s)
	return t
end
  
function _ParseFieldNames(fields, fieldTypes)
	local fieldNames = {}
  
	for i, fieldType in ipairs(fieldTypes) do
		local fieldName = {}
		if fieldType.isStruct then
			local names = stringSplit(fields[i], "|")
			fieldName.structName = names[1]
			fieldName.structFieldNames = {}
			-- print(names[1])
			for j=2, #names do
				-- print(names[j])
				table.insert(fieldName.structFieldNames, names[j])
			end
		else
			fieldName = fields[i] 
		end
		table.insert(fieldNames, fieldName)
	end
	return  fieldNames
end
  
function _ParseFieldTypes(fields)
	local fieldTypes = {}

	for i, field in ipairs(fields) do
		local fieldType = {}

		local len = string.len(field)
		fieldType.isArray = string.sub(field, -2) == "[]"
		fieldType.isStruct = string.sub(field, 1, 1) == "[" and string.sub(field, -1, -1) == "]"
  
		if fieldType.isStruct then
			local pos = string.find(field, "]")
			local structType = string.sub(field, 2, pos-1)
			local types = stringSplit(structType, "|")
			fieldType.dataType = types
		else
			local pos = string.find(field, "%[")
			if pos then
				fieldType.dataType = string.sub(field, 1, pos-1)
			else
				fieldType.dataType = field
			end
		end
		table.insert(fieldTypes, fieldType)
	end
	return fieldTypes
end
  
function _ParseFieldDesc(fields)
	  -- do nothing
end
  
function _ParseTypeValue(dataType, dataValue)
	local value = nil

	if dataType == "int" then
		value = tonumber(dataValue)
	elseif dataType == "float" then
		value = tonumber(dataValue)
	elseif dataType == "string" then
		value = tostring(dataValue)
	else
		print("invalid type value!!" .. dataType .. "invalid type value!!")
	end
	return value
end
  
function _ParseStructValue(dataType, dataName, dataValue)
	local structTable = {}
	local fs = stringSplit(dataValue, "|")
	for i,v in ipairs(fs) do
		structTable[dataName[i]] = _ParseTypeValue(dataType[i], v)
	end
  
	return structTable
end
  
function _ParseField(field, fieldName, fieldType, config)
	if field == nil or field == "" then
		if fieldType.isStruct then
			config[fieldName.structName] = nil
		else
			config[fieldName] = nil
		end
		return nil
	end
  
	if fieldType.isArray then
		if fieldType.isStruct then
		 --Debug.Log(field);
			config[fieldName.structName] = {}
			for w in string.gmatch(field, "%[.-%]") do
				local data = string.sub(w, 2, -2);
				local structValue = _ParseStructValue(fieldType.dataType, fieldName.structFieldNames, data)
				table.insert(config[fieldName.structName], structValue)
			end
			return config[fieldName.structName]
		else
			local fs = stringSplit(field, "|")
			config[fieldName] = {};
			for i,v in ipairs(fs) do
				config[fieldName][i] = _ParseTypeValue(fieldType.dataType, v)
			end
			return config[fieldName]
		end
  
	else
		if fieldType.isStruct then
			local dataValue = string.sub(field, 2, -2);
			config[fieldName.structName] = _ParseStructValue(fieldType.dataType, fieldName.structFieldNames, dataValue)
			return config[fieldName.structName]
		else
			config[fieldName] = _ParseTypeValue(fieldType.dataType, field)
			return config[fieldName]
		end
	end
end
  
  function _ParseFields(fields, fieldNames, fieldTypes)
	  local config = {}
	  local key = "" 		

	  for i, field in ipairs(fields) do
		  local fieldValue = _ParseField(field, fieldNames[i], fieldTypes[i], config)
		  if fieldTypes[i].key == true then
			  if key == "" then
				  key = fieldValue
			  else
				if type(key) == "string" then
					key = string.sub(key,1,-2) .. "^" .. fieldValue .. "\"" 
				else
					key = "\"" .. key .."^"..fieldValue .. "\""
				end
			  end
		  end
	  end
  
	  return key, config
  end
  
  function _ParseKeys(fields, fieldTypes)
	  for i,v in ipairs(fields) do
		  if v == "key" then
			  fieldTypes[i].key = true
		  else
			  fieldTypes[i].key = false
		  end
	  end
  end
-- ****** 解析GDS用的 ******



-- ********** 将 lua table 序列化存为字符串 开始 **********
local tab = "    "
-- 序列化方法
function Serialize(aimTable)
	local serMark = {}

	function SerializeInline(tbl, parent, floor)
		local inlineTab = ""
		local endTab = ""
		for i = 1, floor do
			inlineTab = inlineTab .. tab
		end
		for i = 1, floor - 1 do
			endTab = endTab .. tab
		end

		serMark[tbl] = parent

		-- 遍历所有的成员
		local hasCheckIsNumber = false
		local isNumber = nil

		local allElems = {}
		for k,v in pairs(tbl) do
			if parent == "ret" then 
				if not hasCheckIsNumber then 
					if tonumber(k) == nil then 
						isNumber = false
					else 
						isNumber = true
					end 
				end 
			else
				if not hasCheckIsNumber then 
					if type(k) == "number" then 
						isNumber = true
					else 
						isNumber = false
					end 
				end 
			end 
			allElems[#allElems + 1] = { key = k, value = v }
			hasCheckIsNumber = true
		end
		if not isNumber then 
			-- 针对这乱序的的结果排个序
			table.sort(allElems, function (a, b) return tostring(a.key) > tostring(b.key) end)
		end 
		-- 对所有的成员进行递归分析
		local tmp = {}
		for i = 1, #allElems do
			local info = allElems[i]
			local k = info.key
			local v = info.value
			
			local key = k
			if type(k) == "number" then
				key = k
			else 
				key = k
			end

			if type(v) == "table" then
				local dotkey = parent .. "." .. key
				if type(k) == "number" then
					dotkey = parent .. key
				end 

				if serMark[v] == nil then
					if isNumber then 
						if i == #allElems then
							table.insert(tmp, inlineTab .. SerializeInline(v, dotkey, floor + 1) )
						else 
							table.insert(tmp, inlineTab .. SerializeInline(v, dotkey, floor + 1) .. ",")
						end 
					else 
						if parent == "ret" then 
							table.insert(tmp, inlineTab .. "\"" .. key .. "\":" .. SerializeInline(v, dotkey, floor + 1))							
						else 
							if i == #allElems then 
								table.insert(tmp, inlineTab .. "\"" .. key .. "\":" .. SerializeInline(v, dotkey, floor + 1))
							else
								table.insert(tmp, inlineTab  .. "\"".. key .. "\":" .. SerializeInline(v, dotkey, floor + 1) .. ",")
							end 
						end 
					end
				end
			else
				if type(k) == "number" then 
					if type(v) == "string" then
						if i == #allElems then
							table.insert(tmp, inlineTab .. '"' .. v .. '"')
						else
							table.insert(tmp, inlineTab .. '"' .. v .. '"' .. ",")
						end
					else
						if i == #allElems then
							table.insert(tmp, inlineTab .. tostring(v) )
						else
							table.insert(tmp, inlineTab .. tostring(v) .. ",")
						end
						
					end
				else
					if type(v) == "string" then
						if i == #allElems then
							table.insert(tmp, inlineTab .."\"".. key .. '\":"'.. v ..'"'  )
						else
							table.insert(tmp, inlineTab .."\"".. key .. '\":"'.. v ..'"'  .. ",")
						end
					else
						if i == #allElems then
							table.insert(tmp, inlineTab .. "\""..key .. "\": " .. tostring(v))
						else
							table.insert(tmp, inlineTab .. "\""..key .. "\": " .. tostring(v) .. ",")
						end
					end
				end				
			end
			if i ~= #allElems then
				table.insert(tmp, "\n")
			end
		end

		if parent == "ret" then 
			if isNumber then 
				return  "{\n   \"Config\" : [" .. "\n" .. table.concat(tmp) .. "\n" .. endTab .. "    ]\n}"
			else
				return "{" .. "\n" .. table.concat(tmp) .. "\n" .. endTab .. "}"
			end
		else 	 
			if isNumber then 
				return "[" .. "\n" .. table.concat(tmp) .. "\n" .. endTab .. "]"
			else
				return "{" .. "\n" .. table.concat(tmp) .. "\n" .. endTab .. "}"
			end
		end
		
	end

	return SerializeInline(aimTable, "ret", 1)
end
-- ********** 将 lua table 序列化存为字符串 结束 **********


-- ********** 文件的操作 开始 **********
function Readfile(path)
	local file = io.open(path, "r")
	local data = file:read("*a")
	file:close()
	return data
end

function Writefile(str, file)
	os.remove(file)
	local file = io.open(file, "ab")
	file:write(str)
	file:close()
end
-- ********** 文件的操作 结束 **********


-- ********** 正式的解析流程 开始**********--
local csvPath = arg[1]
local luaPath = arg[2]
local luaName = arg[3]

local fileStr = Readfile(csvPath)

local names = stringSplit(luaName, ".")

local tblData = GdsInitCallback(names[1], fileStr)

fileStr = Serialize(tblData)

--ileStr = "export default " .. names[1] .. " " .. fileStr--
-- fileStr = "export default " .. " " .. fileStr

Writefile(fileStr, luaPath .. "/" .. names[1] .. ".json")
-- ********** 正式的解析流程 结束**********--
