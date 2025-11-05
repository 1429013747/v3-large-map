export const getIconPath = (icon) => {
    return new URL(`/src/assets/imgs/${icon}.png`, import.meta.url).href;
};
export const getIconPathMarkIcons = (icon) => {
    return new URL(`/src/assets/imgs/markIcons/${icon}.png`, import.meta.url).href;
};

/**
 * 下载文件
 * @param {Object} res 响应对象
 */
export function downloadfile(res) {
    var blob = new Blob([res.data], { type: 'application/octet-stream;charset=UTF-8' })
    var contentDisposition = res.headers['content-disposition']
    var patt = new RegExp('filename=([^;]+\\.[^\\.;]+);*')
    var result = patt.exec(contentDisposition)
    var filename = result[1]
    var downloadElement = document.createElement('a')
    var href = window.URL.createObjectURL(blob) // 创建下载的链接
    var reg = /^["](.*)["]$/g
    downloadElement.style.display = 'none'
    downloadElement.href = href
    downloadElement.download = decodeURI(filename.replace(reg, '$1')) // 下载后文件名
    document.body.appendChild(downloadElement)
    downloadElement.click() // 点击下载
    document.body.removeChild(downloadElement) // 下载完成移除元素
    window.URL.revokeObjectURL(href)
}

/**
 * 点击下载文件
 * @param {Object} file 文件对象
 */
export function clickDownloadFile(file) {
    const blob = new Blob([file.url], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.fileOriginName || '下载文件.pdf'
    a.click()
    URL.revokeObjectURL(url)
}