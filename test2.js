const tasks = [
  function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('function1');
      }, 1000);
    });
  },
  function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('function2');
      }, 1000);
    });
  },
  function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('function3');
      }, 3000);
    });
  },
  function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('function4');
      }, 1000);
    });
  },
  function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('function5');
      }, 1000);
    });
  }
]

function controlRequest(tasks, max = 1) {
  return new Promise((resolve, reject) => {
    let index = 0
    const result = []
    let sumRequest = 0
    function run() {
      const flatIndex = index
      tasks[flatIndex]().then(res => {
        result[flatIndex] = res
        console.log(result);
      }).finally(() => {
        sumRequest++
        if (sumRequest >= tasks.length) {
          resolve(result)
        }
        if (index < tasks.length) {
          run()
        }
      })
      index++
    }

    for (let i = 0; i < Math.min(tasks.length - 1, max); i++) {
      run()
    }
  })
}

controlRequest(tasks).then(res => {
  console.log("🚀 ~ res:", res)
})
