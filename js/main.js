'use strict';
/* global $ */
/* global console */
/* jshint -W097 */

$(function() {
    var i = 0, j = 0;
    var dateNow, weekDayNow, yearNow, monthNow;
    var yearRead, monthRead;
    var weekDayCN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var weekDayJP = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];

    var $tbody = $('#bangumi_list');
    var $switcher = $('#switcher');
    var $orderJP = $('table th:eq(1) p');
    var $orderCN = $('table th:eq(2) p');
    var $search = $('#search input');
    var $topNav = $('#topnav');

    var archive = null,
        bgmData = null;

    var status = {
        reverse: true,
        switch: 7,
        lastModified: '',
        nextTime: 24
    };

    var query = {
        weekDay: -1,
        nextTime: 22,
        title: '',
        newBgm: true
    };

    //不分辨大小写的:contains
    $.expr[":"].containsI = $.expr.createPseudo(function(arg) {
        return function( elem ) {
            return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });

    //格式化星期几
    function formatWeekDay(index, country) {
        switch (country.toLowerCase()) {
            case 'cn':
                return weekDayCN[index];
            case 'jp':
                return weekDayJP[index];
            default:
                return weekDayCN[index];
        }
    }

    //格式化时间
    function formatTime(time) {
        return time ? time.slice(0, 2) + ':' + time.slice(2) : '(预计)';
    }

    //转换两种星期顺序
    function convertWeekDay(index, flag) {
        if (flag) {
            return index >= 6 ? 0 : index + 1;
        } else {
            return index <= 0 ? 7 : index - 1;
        }
    }

    //将当前月份转换为季度
    function monthToSeason(month) {
        switch (true) {
            case (month < 4):
                return 1;
            case (month < 7):
                return 4;
            case (month < 10):
                return 7;
            case (month <= 12):
                return 10;
            default:
                throw new Error('failed convrting to season');
        }
    }

    //用于获取链接的域名
    function getDomain(url) {
        var re = /^https{0,}:\/\/\w+\.(\w+)\.\w+/i;
        if (url !== '#') {
            return url.match(re)[1].toLowerCase();
        } else {
            return 'empty';
        }
    }

    //通过年份和月份得到数据文件的路径
    function getPath(year, month, archive) {
        for (i = 0; i < archive.length; i++) {
            if (archive[i].year == year) {
                var months = archive[i].months;
                yearRead = archive[i].year;
                monthRead = monthToSeason(month);
                for (j = 0; j < months.length; j++ ) {
                    if (monthRead === months[j].month && months[j].json) {
                        return months[j].json;
                    }
                }
                if (monthRead === 1) {
                    return getPath(year - 1, 10, archive);
                } else {
                    return getPath(year, month - 3, archive);
                }
            }
        }
        return getPath(year - 1, month, archive);
    }

    //排序链接
    function sortLink(a, b) {
        a = getDomain(a);
        b = getDomain(b);
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    }

    //格式化链接
    function formatLink(url) {
        switch (getDomain(url)) {
            case 'youku':
                return '优酷';
            case 'sohu':
                return '搜狐';
            case 'qq':
                return '腾讯';
            case 'iqiyi':
                return '爱奇艺';
            case 'letv':
                return '乐视';
            case 'pptv':
                return 'PPTV';
            case 'tudou':
                return '土豆';
            case 'bilibili':
                return 'B站';
            case 'acfun':
                return 'A站';
            case 'movie':
                return '迅雷';
            case 'empty':
                return '暂无';
            default:
                return '未知';
        }
    }

    //将trArray中的HTML插入表格
    function showTable(HTML) {
        if ($tbody.find('tr').length) {
            $tbody.find('tr').remove();
        }
        $tbody.append(HTML);
    }

    //控制排序按钮
    function orderHandler(country) {
        return function() {
            $(this).parents('tr').find('p').removeClass('ordered');
            $(this).addClass('ordered');
            sortData(bgmData, !status.reverse, country);
            showTable(dataToHTML(bgmData));
            tableFilter();
        };
    }


    //data数列排序
    function sortData(data, reverse, country) {
        var weekDay = '', time = '';
        var flag = (reverse ? -1 : 1);
        status.reverse = reverse;
        if (country) {
            weekDay = 'weekDay' + country.toUpperCase();
            time = 'time' + country.toUpperCase();
        } else {
            weekDay = 'weekDayCN';
            time = 'timeCN';
        }
        data.sort(function(a, b) {
            if(a[weekDay] === b[weekDay]) {
                return flag * ((a[time] === '' ? -1 : +a[time]) -
                    (b[time] === '' ? -1 : +b[time]));
            } else {
                return flag * (a[weekDay] - b[weekDay]);
            }
        });
    }

    //将data数列转换为HTML
    function dataToHTML(data) {
        var trHTML = '';
        for (i = 0; i < data.length; i++) {
            trHTML += '<tr><td><a href="' + data[i].officalSite + '" title="' +
                data[i].titleJP + (data[i].newBgm ? '" class="new">' : '">') +
                data[i].titleCN + '</a></td><td><span class="weekDay">' +
                formatWeekDay(data[i].weekDayJP, 'cn') + '</span><span class="time">' +
                formatTime(data[i].timeJP) + '</span></td><td><span class="weekDay">' +
                formatWeekDay(data[i].weekDayCN, 'cn') + '</span><span class="time">' +
                formatTime(data[i].timeCN) + '</span></td>';
            if (data[i].onAirSite.length) {

                //将链接排序
                data[i].onAirSite.sort(sortLink);

                trHTML += '<td><ul class="link-list">';
                for (j = 0; j < data[i].onAirSite.length; j++) {
                    if (j === data[i].onAirSite.length - 1) {
                        trHTML +=  '<li class="lastLink">';
                    } else {
                        trHTML += '<li>';
                    }
                    trHTML += '<a href="' + data[i].onAirSite[j] + '" target="_self">' +
                    formatLink(data[i].onAirSite[j]) + '</a></li>';
                }
                trHTML += '</ul></td></tr>';
            } else {
                trHTML += '<td class="empty">暂无</td></tr>';
            }
        }
        return trHTML;
    }

    //构建历史数据菜单
    function buildArchive(archive) {
        var html = '';
        var $node = null;
        for(i = 0; i < archive.length; i++) {
            var months = archive[i].months;
            html += '<li><a href="#">' + archive[i].year + '年</a><ul class="submenu month">';
            for (j = 0; j < months.length; j++) {
                html += '<li><a href="#" data-json="' + months[j].json + '">' + months[j].month + '月</a></li>';
            }
            html += '</ul></li>';
        }
        $node = $(html);

        $node.each(function() {
            $(this).hover(function() {
                $(this).find('ul').show();
            }, function() {
                $(this).find('ul').hide();
            }).find('ul').hide();
        });
        $node.find('ul a').click(function() {
            var path = $(this).attr('data-json');
            getBgmJSON(path);
            yearRead = +('20' + path.match(/(\d{2})(\d{2})/)[1]);
            monthRead = +(path.match(/(\d{2})(\d{2})/)[2]);
            return false;
        });

        $topNav.find('li ul.year').append($node);
    }

    function tableFilter() {
        var $items = $tbody.children('tr');
        $items.each(function() {
            if(decideShow($(this))) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
        console.log(query);
    }

    function decideShow(item) {
        var showFlag = false;
        var itemWeekDay = item.find('td:eq(2) .weekDay').text();
        var itemTime = +(item.find('td:eq(2) .time').text().slice(0,2));
        if (!itemTime) {
            itemTime = 0;
        }
        if (query.weekDay === -1 ) {
            showFlag = true;
        } else if ((itemWeekDay === weekDayCN[query.weekDay] && itemTime < query.nextTime) ||
                        (itemWeekDay ===  weekDayCN[(query.weekDay === 0 ? 6 : query.weekDay - 1)] &&
                        itemTime >= query.nextTime)) {
            showFlag = true;
        }
        if (query.newBgm && !item.find('td:eq(0) a').is('.new')) {
            showFlag = false;
        }
        if (query.title) {
            var re = new RegExp(query.title, 'i');
            if (!re.test(item.find('td:eq(0)').text())) {
                showFlag = false;
            }
        }
        return showFlag;
    }


    //ajax读取bangumi的json
    function getBgmJSON(path) {
        $.ajax({
            //bangumi JSON
            url: path,
            //成功时
            success: function(data, stat, xhr) {
                //将获得的番组数据存入变量
                bgmData = data;
                //模拟点击排序按钮(中国时间)
                $orderCN.trigger('click');
                //模拟点击switcher按钮，传入保存的序号
                $switcher.trigger('click', [status.switch]);
                //过滤表格
                tableFilter();
                //获取数据文件最后修改时间
                if (xhr.getResponseHeader('Last-Modified')) {
                    //将获得的header数据转换为Date对象
                    var tempDate = new Date(xhr.getResponseHeader('Last-Modified'));
                    //将数据组合传入变量
                    status.lastModified = '数据更新日期: ' + tempDate.getFullYear() + '年' +
                        (tempDate.getMonth() + 1) + '月' + tempDate.getDate() + '日';
                }
                //更新标题
                $('#header h1').text(yearRead + '年' + monthRead + '月番组');
                //更新番组数目
                $('#header .total').text('当季共有' + data.length + '部番组');
                //更新最后修改时间
                $('#header .lastModified').text(status.lastModified);
            },
            //失败时
            error: function(xhr, stat, error) {
                //在表格中添加显示错误信息的行
                $tbody.append('<tr><td colspan="4">读取 ' + path + ' 出错，错误代码：' +
                    xhr.status + ' ' + error + '</td></tr>');
            }
        });
    }

    //ajax读取archive
    $.ajax({
        //archive JSON
        url: 'json/archive.json',
        //成功时
        success: function(data, stat, xhr) {
            //获取当前服务器时间。如服务器时间不可用，使用本地时间
            dateNow = xhr.getResponseHeader('Date') ? new Date(xhr.getResponseHeader('Date')) : new Date();
            yearNow = dateNow.getFullYear();
            monthNow = dateNow.getMonth() + 1;
            weekDayNow = dateNow.getDay();
            //将获取的星期几传唤为switcher的序号，存入变量
            status.switch = convertWeekDay(weekDayNow, false);
            //将获取的数据存入变量
            archive = data;
            //获取番组json路径，读取
            getBgmJSON(getPath(yearNow, monthNow, data));
            //初始化历史数据菜单
            buildArchive(data);
        },
        //出错时
        error: function(xhr, stat, error) {
            //在表格中添加显示错误信息的行
            $tbody.append('<tr><td colspan="4">读取 json/archive.json 出错，错误代码：' +
                xhr.status + ' ' + error + '</td></tr>');
        }
    });

    //选择器点击事件
    $switcher.click(function(event, index) {
            var $target = $(event.target);
            //将所有选择器按钮的class清空
            $switcher.children().removeClass('selected');
            //使用undefined判断，防止误判数字0
            if (index !== undefined) {
                //给指定的按钮添加class
                $switcher.find('li:eq(' + index + ')').addClass('selected');
            } else {
                //如果index参数不存在，使用event目标在ul中的序列代替
                index = $target.index();
                //给指定的按钮添加class
                $target.addClass('selected');
            }
            //'周日'-->'weekDay:0'
            if (index === 6) {
                query.weekDay = 0;
            //'全部'-->'weekDay:-1'
            } else if (index === 7) {
                query.weekDay = -1;
            } else {
                query.weekDay = index + 1;
            }
            //过滤表格
            tableFilter();
    });

    //排序按钮点击事件
    $orderCN.click(orderHandler('CN'));
    $orderJP.click(orderHandler('JP'));

    //导航栏主按钮hover事件
    $topNav.find('.menu').hover(function() {
        $(this).children('ul').show();
    }, function() {
        $(this).children('ul').hide();
    }).children('ul').hide();

    //搜索框keyup事件
    $search.keyup(function(event) {
        $switcher.trigger('click', [7]);
        $(this).next().show();
        query.title = $(this).val();
        tableFilter();
        //按下ESC键
        if(event.keyCode === 27) {
            //清空搜索框，失去焦点
            $(this).blur().val('');
            //清空查询对象中的标题字符串
            query.title = '';
            //模拟点击switcher，传入保存的switch序号
            $switcher.trigger('click', [status.switch]);
            //隐藏清除按钮
            $(this).next().hide();
        //回车清空搜索栏
        } else if (event.keyCode === 8 && event.target.value.length <= 0) {
            $switcher.trigger('click', [status.switch]);
            $(this).next().hide();
        }
    })
        //清除按钮的点击事件
        .next().hide().click(function() {
            $search.blur().val('');
            query.title = '';
            $switcher.trigger('click', [status.switch]);
            //隐藏清除按钮
            $(this).hide();
        });
});
