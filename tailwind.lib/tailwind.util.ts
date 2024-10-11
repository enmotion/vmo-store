module.exports = {
  generateAlphaColorStep(color:string,step:number=10){
    const props:{[key:string]:any} = {};
    for(let i=1 ; i <= step ; i++){
      const stepoffset = parseFloat((1/step*i).toFixed(2));
      props[i]=`rgba(var(${color}),${stepoffset})`;
    };
    return props;
  },
  generateHexAlphaColorStep(color:string='#FF0000',step:number=10){
    const props:{[key:string]:any} = {};
    for(let i=1 ; i <= step ; i++){
      const stepoffset = (Math.max(Math.round(256/step*i-1),0).toString(16)).toUpperCase();
      props[i] = color + (stepoffset.length<2 ?'0'+stepoffset:stepoffset); // 防止过小的值缺少位数
    };
    return props;
  },
  generateSpacing(minstep:number=5,maxstep:number=100,limit:number=1200){
    const props:{[key:string]:any} = {};
    let step = 0;
    for(let i = 0 ; i <= limit ; i += step){
      step = Math.min(minstep * Math.pow(2,Math.floor(i/maxstep)),maxstep);
      props[i.toString()] = i + 'px';
    }
    return props
  },
  generateStepUint(step:number=12){
    const props:{[key:string]:any} = {};
    for(let i = 0 ;i<=step;i++){
      props[i]=i
    }
    return props
  }
}

