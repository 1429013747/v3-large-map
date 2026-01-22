const tasks = [
  function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('function1');
      }, 5000);
    });
  },
  function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('function2');
      }, 2000);
    });
  },
  function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('function3');
      }, 1000);
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
      }, 4000);
    });
  }
]
