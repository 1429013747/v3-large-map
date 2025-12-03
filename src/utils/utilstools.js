export const getIconPath = (icon) => {
    return new URL(`/src/assets/imgs/${icon}.png`, import.meta.url).href;
  };
  export const getIconPathMarkIcons = (icon) => {
    return new URL(`/src/assets/imgs/markIcons/${icon}.png`, import.meta.url).href;
  };
  export const getComprehensiveituationIcons = (icon) => {
    return new URL(`/src/assets/imgs/comprehensive-situation_imgs/${icon}.png`, import.meta.url).href;
  };
  export const riskTyes = ['', '正常码头', '废弃码头', '冲滩点', '埠口', '岙口', '岸线', '其他'];
  
  // 计算风险点图标偏移量
  export const calculateRiskPointIconOffset = (level) => {
    switch (level) {
      case 1:
        return [36 * 8, 0];
      case 2:
        return [36 * 7, 0];
      case 3:
        return [36 * 6, 0];
      case 4:
        return [36 * 4, 0];
      case 5:
        return [36 * 5, 0];
      default:
        return [36 * 8, 0];
    }
  };
  
  // 解析为日期对象
  export const parseTimeString = (timeStr) => {
    // 分割日期和时间部分
    const [datePart, timePart] = timeStr.split('/');
  
    // 提取年月日
    const year = parseInt(datePart.slice(0, 4));
    const month = parseInt(datePart.slice(4, 6)) - 1; // 月份从0开始
    const day = parseInt(datePart.slice(6, 8));
  
    // 提取时分秒
    const hours = parseInt(timePart.slice(0, 2));
    const minutes = parseInt(timePart.slice(2, 4));
    const seconds = parseInt(timePart.slice(4, 6));
  
    // 创建日期对象
    return new Date(year, month, day, hours, minutes, seconds);
  };
  
  export function downloadfile(res) {
    var blob = new Blob([res.data], { type: 'application/octet-stream;charset=UTF-8' });
    var contentDisposition = res.headers['content-disposition'];
    var patt = new RegExp('filename=([^;]+\\.[^\\.;]+);*');
    var result = patt.exec(contentDisposition);
    var filename = result[1];
    var downloadElement = document.createElement('a');
    var href = window.URL.createObjectURL(blob); // 创建下载的链接
    var reg = /^["](.*)["]$/g;
    downloadElement.style.display = 'none';
    downloadElement.href = href;
    downloadElement.download = decodeURI(filename.replace(reg, '$1')); // 下载后文件名
    document.body.appendChild(downloadElement);
    downloadElement.click(); // 点击下载
    document.body.removeChild(downloadElement); // 下载完成移除元素
    window.URL.revokeObjectURL(href);
  }
  
  export function clickDownloadFile(file) {
    const blob = new Blob([file.url], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileOriginName || '下载文件.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }
  