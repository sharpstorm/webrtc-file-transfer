// Little-Endian version

function readShort(data, offset){
  return (data[offset] & 255) +
         ((data[offset+1] & 255) << 8);
}

function readInt(data, offset){
  return (data[offset] & 255) +
         ((data[offset+1] & 255) << 8) +
         ((data[offset+2] & 255) << 16) +
         ((data[offset+3] & 255) << 24);
}

function readJSLong(data, offset){
  return (data[offset] & 255) +
         ((data[offset+1] & 255) << 8) +
         ((data[offset+2] & 255) << 16) +
         ((data[offset+3] & 255) << 24) +
         shift((data[offset+4] & 255), 32) +
         shift((data[offset+5] & 255), 40);
}

function readByteArray(data, offset, len){
  return data.slice(offset, offset + len);
}

function readString(data, offset){
  const len = readShort(data, offset);
  return decodeEncodedString(data, offset + 2, false, offset + 2 + len);
}

function writeShort(data){
  return [data & 255,
         (data >> 8) & 255];
}

function writeInt(data){
  return [data & 255,
         (data >> 8) & 255,
         (data >> 16) & 255,
         (data >> 24) & 255
         ];
}

function writeJSLong(data){
  return [data & 255,
         (data >> 8) & 255,
         (data >> 16) & 255,
         (data >> 24) & 255,
         shift(data, -32) & 255,
         shift(data, -40) & 255
         ];
}

function shift(number, shift) {
    return number * Math.pow(2, shift);
}

function writeString(data){
  return writeShort(data.length).concat(encodeString(data, false));
}

function arrToString(data, start){
  if(start == undefined) start = 0;

  var ret = [];
  for(var i=start;i<data.length;i++){
    ret.push(String.fromCharCode(data[i]));
  }
  return ret.join("");
}

function decodeEncodedString(data, start, isUtf8, end){
  if(start == undefined) start = 0;
  if(isUtf8 == undefined) isUtf8 = false;
  if(end == undefined) end = data.length;

  var ret = [];
  if(isUtf8){
    for(var i=start;i<end;i++){
      let charCode;
      if(data[i] < 128)
      charCode = data[i];
      else if(data[i] < 224){
        charCode = (data[i+1] & 63) + ((data[i] & 31) << 6);
        i += 1;
      }else if(data[i] < 240){
        charCode = (data[i+2] & 63) + ((data[i+1] & 63) << 6) + ((data[i] & 15) << 12);
        i += 2;
      }else{
        charCode = (data[i+3] & 63) + ((data[i+2] & 63) << 6) + ((data[i+1] & 63) << 12) + ((data[i] & 7) << 18);
        i += 3;
      }
      ret.push(String.fromCharCode(charCode));
    }
  }else{
    for(var i=start;i<end;i++){
      ret.push(String.fromCharCode(data[i]));
    }
  }
  return ret.join("");
}

function encodeString(data, isUtf8){
  let ret = [];
  if(isUtf8 == undefined) isUtf8 = false;

  if(isUtf8){
    for(var i=0;i<data.length;i++){
      const code = data.charCodeAt(i);
      if(code < 128){
        ret.push(code);
      }else if(code < 2048){
        ret.push(192 + ((code) >> 6));
        ret.push(128 + ((code) & 63));
      }else if(code < 65536){
        ret.push(224 + (code >> 12));
        ret.push(128 + ((code >> 6) & 63));
        ret.push(128 + ((code) & 63));
      }else{
        ret.push(240 + (code >> 18));
        ret.push(128 + ((code >> 12) & 63));
        ret.push(128 + ((code >> 6) & 63));
        ret.push(128 + ((code) & 63));
      }
    }
  }else{
    for(var i=0;i<data.length;i++){
      ret.push(data.charCodeAt(i));
    }
  }
  return ret;
}

////////////////// Special functions //////////////////////
function hasUtf8(str) {
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 255) return true;
    }
    return false;
}
