const listTree = [
  { id: 1, pid: null, label: "1" },
  { id: 2, pid: 1, label: "2" },
  { id: 3, pid: 1, label: "3" },
  { id: 4, pid: 2, label: "4" },
  { id: 5, pid: 2, label: "5" },
  { id: 6, pid: 3, label: "6" },
  { id: 7, pid: 3, label: "7" },
  { id: 8, pid: 4, label: "8" },
  { id: 9, pid: 4, label: "9" },
  { id: 10, pid: 5, label: "10" },
];

function listToTree(data, parentId = null) {
  // const nodes = data.filter(item => item.pid === parentId)
  // return nodes.map(el => {
  //   const children = listToTree(data, el.id)
  //   return {
  //     ...el,
  //     children
  //   }
  // })

  const map = {}
  const result = []
  data.forEach(el => {
    map[el.id] = { ...el, children: [] }
  })
  data.forEach(el => {
    if (el.pid) {
      map[el.pid].children.push(map[el.id])
    } else {
      result.push(map[el.id])
    }
  })
  return result
}

const data = listToTree(listTree)
console.log(JSON.stringify(data, null, 2));
