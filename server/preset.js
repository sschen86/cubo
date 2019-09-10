// \x01 - \x07  \x11 -\x19

const ELEMENT_OPEN = '\x01' // 页面元素开启标识
const ELEMENT_CLOSE = '\x02' // 页面元素结束标识

const CTPL_OPEN = '\x03' // 前端模板语法开启标记
const CTPL_CLOSE = '\x04' // 前端模板语法结束标记

const STPL_OPEN = '\x05'
const STPL_CLOSE = '\x06'

const TPL_QUOTE = '\x07' /// 模板占位符
const REPLACE = '\x11' // 替换占位符

export const CHAR = {
    ELEMENT_OPEN, ELEMENT_CLOSE, CTPL_OPEN, CTPL_CLOSE, STPL_OPEN, STPL_CLOSE, TPL_QUOTE, REPLACE,
}

export const REGEXP = {
    INC_MOD: newWrapperRegexp('incmode'),
    USE_MOD: newWrapperRegexp('usemode'),
    LINK_MOD: newWrapperRegexp('linkmode'),
    CDATA: newWrapperRegexp('cdata'),
    SDATA: newWrapperRegexp('sdata'),
    AJAX: newWrapperRegexp('ajax'),
    CSS: newWrapperRegexp('css'),
    JS: newWrapperRegexp('js'),
    DEF: newWrapperRegexp('def'),
}

export const wrapper = {
    element: text => ELEMENT_OPEN + text + ELEMENT_CLOSE,
    ctpl: text => CTPL_OPEN + text + CTPL_CLOSE,
    stpl: text => STPL_OPEN + text + STPL_CLOSE,
}

export function newWrapperRegexp (type, flag) {
    switch (type) {
        case 'incmod': {
            return RegExp(ELEMENT_OPEN + 'incmod (\\d+)' + ELEMENT_CLOSE, flag)
        }
        case 'cdata': {
            return RegExp(ELEMENT_OPEN + 'cdata (\\S+) (\\d+)' + ELEMENT_CLOSE, flag)
        }
        case 'usemod': {
            return RegExp(ELEMENT_OPEN + 'usemod (\\S+) (\\S+?)' + ELEMENT_CLOSE, flag)
        }
        case 'sdata': {
            return RegExp(ELEMENT_OPEN + 'sdata (\\S+) (\\d+)' + ELEMENT_CLOSE, flag)
        }
        case 'ajax': {
            return RegExp(ELEMENT_OPEN + 'ajax (.+?)' + ELEMENT_CLOSE, flag)
        }
        case 'css': {
            return RegExp(`${ELEMENT_OPEN}css (\\S+) (\\d+)${ELEMENT_CLOSE}|${ELEMENT_OPEN}ctplcss (\\S+) (\\d+)${ELEMENT_CLOSE}([\\w\\W]*?)${ELEMENT_OPEN}/ctplcss${ELEMENT_CLOSE}`, flag)
        }
        case 'js': {
            return RegExp(`${ELEMENT_OPEN}js (\\S+) (\\d+)${ELEMENT_CLOSE}|${ELEMENT_OPEN}ctpljs (\\S+) (\\d+)${ELEMENT_CLOSE}([\\w\\W]*?)${ELEMENT_OPEN}/ctpljs${ELEMENT_CLOSE}`, flag)
        }
        case 'linkmod': {
            return RegExp(`${ELEMENT_OPEN}linkmod (\\S+) (\\S+)${ELEMENT_CLOSE}`, flag)
        }
        case 'def': {
            return RegExp(`${STPL_OPEN}def ([\\w$]+) = (.+?)${STPL_CLOSE}`, flag)
        }
    }
}
