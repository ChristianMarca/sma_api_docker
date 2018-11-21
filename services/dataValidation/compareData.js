//Algorithm based on Levenshetein Distance
  similarity=(s1, s2, editDistance,distanceLevenshtein)=> {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength === 0) {
      return 1.0;
    }
    const distance=editDistance(longer, shorter);
    const distance1=distanceLevenshtein(longer, shorter);
    console.log(distance,'test Distance',distance1)
    return (longerLength - distance) / parseFloat(longerLength);
  }
  editDistance=(s1, s2)=> {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i === 0)
          costs[j] = j;
        else {
          if (j > 0) {
            var newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue),
                costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  distanceLevenshtein=(s1,s2)=>{
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    var s1_len=s1.length;
    var s2_len=s2.length;
    var d=[];
    var c=0;
    var a=0;

    for (var i = 0; i <=s1_len; i++) {
      d[i] = new Array(2);
    }
    for (var j=0; j<=s1_len;j++){
      d[0][j]=j;
    }
    for (var i=0; i<=s2_len;i++){
      d[i][0]=i;
    }
    console.log(d)
    for(var i=1;i<=s2_len;i++){
      for(var j=1;j<=s1_len;j++){
        if(s1[j]===s2[i]){
          c=0
        }
        else{
          c=1
        }
        d[i][j]=Math.min(
          d[i-1][j]+1,
          d[i][j-1]+1,
          d[i-1][j-1]+c
          )
      }
    }
    return d
  }