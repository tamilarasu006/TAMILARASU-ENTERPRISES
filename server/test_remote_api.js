fetch('https://tamilarasu-enterprises-1.onrender.com/api/products')
  .then(r => r.json())
  .then(d => {
    console.log(d.data ? `Products received: ${d.data.length}` : d);
    if(d.data && d.data.length > 0) {
       console.log('Sample product:', d.data[0].name, 'isActive:', d.data[0].isActive);
    }
  })
  .catch(e => console.error('Fetch error:', e));
