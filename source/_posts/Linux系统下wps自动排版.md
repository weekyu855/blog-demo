---
title: Linux系统下wps自动排版
date: 2026-03-18 12:12:12
tags: 教程
categories: wps
excerpt: "一键将信息、分析调整为内网上报格式。自动检索半角符号为全角符号。最终提升工作效率，减少格式错误。"
cover: 
---

# Linux系统下wps自动排版

## 一、有啥用
一键将信息、分析调整为内网上报格式。自动检索半角符号为全角符号。最终提升工作效率，减少格式错误。

## 二、怎么用
### （一）使用前提。
国产电脑linux系统（windows系统不是这套代码），WPS版本不能太低，要有运行宏的功能。国产麒麟系统的WPS版本太低，需要升级后才可使用，稍微有点复杂。
### （二）放入代码。
依次点击开发工具——WPS宏编辑器，将下面代码复制到进去。然后保存（或保存为带宏的格式）。
``` 
function 信息排版()
{
    // ============================
    // 1. 页面设置
    // ============================
    with (ActiveDocument.PageSetup) {
        TopMargin = 104.881050;    // 3.7cm
        BottomMargin = 104.881050; // 3.7cm
        LeftMargin = 79.369446;    // 2.8cm
        RightMargin = 79.369446;   // 2.8cm
        HeaderDistance = 56.692001; // 页眉距边界 2cm
        FooterDistance = 56.692001; // 页脚距边界 2cm
    }

    // ============================
    // 2. 清理文本：标点转换 & 删除空格
    // ============================
    var puncMap = [
        [",", "，"], [".", "。"], [";", "；"], [":", "："],
        ["?", "？"], ["!", "！"], ["(", "（"], [")", "）"],
        [" ", ""],                    // 删除半角空格
        [String.fromCharCode(12288), ""] // 删除全角空格
    ];
    
    var findObj = ActiveDocument.Content.Find;
    for (var i = 0; i < puncMap.length; i++) {
        findObj.Execute(puncMap[i][0], false, false, false, false, false, true, wdFindContinue, false, puncMap[i][1], wdReplaceAll);
    }

    // ============================
    // 3. 删除所有空行
    // ============================
    var paras = ActiveDocument.Paragraphs;
    for (var i = paras.Count; i >= 1; i--) {
        var para = paras.Item(i);
        var txt = para.Range.Text;
        var cleanedText = txt.replace(/[\r\v]/g, "");
        
        if (cleanedText.length === 0) {
            para.Range.Delete();
        }
    }

    // ============================
    // 4. 全文基础格式设置
    // ============================
    Selection.WholeStory();
    
    with (Selection.ParagraphFormat) {
        CharacterUnitFirstLineIndent = 2; // 首行缩进2字符
        FirstLineIndent = 0;
        LineSpacingRule = wdLineSpaceSingle; // 单倍行距
        
        // 全局清理：确保现有段落间距为0
        LineUnitBefore = 0; 
        LineUnitAfter = 0; 
        
        AutoAdjustRightIndent = false; 
        SnapToGrid = false;           
    }

    with (Selection.Font) {
        Size = 12; // 小四号
        NameFarEast = "宋体";
        NameAscii = "Times New Roman";
        NameOther = "Times New Roman";
    }

    // ============================
    // 5. 大标题格式设置 (第一段)
    // ============================
    if (ActiveDocument.Paragraphs.Count > 0) {
        var titleRange = ActiveDocument.Paragraphs.Item(1).Range;
        
        with (titleRange.Font) {
            Name = "宋体";
            NameFarEast = "宋体";
            Size = 12; 
            SizeBi = 12;
            Bold = true; // 加粗
        }

        with (titleRange.ParagraphFormat) {
            Alignment = wdAlignParagraphCenter;
            CharacterUnitFirstLineIndent = 0;
            FirstLineIndent = 0;
            AutoAdjustRightIndent = false;
            SnapToGrid = false;
            LineUnitBefore = 0;
            LineUnitAfter = 0;
        }
    }

    // ============================
    // 6. 一级标题加粗
    // ============================
    var regex = /^[一二三四五六七八九十百]+、/;
    for (var i = 2; i <= ActiveDocument.Paragraphs.Count; i++) {
        var para = paras.Item(i);
        var txt = para.Range.Text;
        
        if (regex.test(txt)) {
            para.Range.Font.Bold = true;
        }
    }

    // ============================
    // 7. 段后插入空行 (强制格式修正)
    // ============================
    var totalParagraphs = ActiveDocument.Paragraphs.Count;
    
    for (var i = totalParagraphs; i >= 2; i--) {
        var para = ActiveDocument.Paragraphs.Item(i);
        var rng = para.Range;
        
        // 插入空段落
        rng.Collapse(wdCollapseEnd);
        rng.InsertParagraphAfter();
        
        // 【修正】通过 Range.ParagraphFormat 访问，更稳定
        // 同时设置“行单位”和“磅单位”，双重保险清除间距
        try {
            var newParaFmt = ActiveDocument.Paragraphs.Item(i + 1).Range.ParagraphFormat;
            
            // 强制段前段后为 0 行
            newParaFmt.LineUnitBefore = 0;
            newParaFmt.LineUnitAfter = 0;
            
            // 强制段前段后为 0 磅 (防止单位锁死)
            newParaFmt.SpaceBefore = 0;
            newParaFmt.SpaceAfter = 0;
        } catch(e) {
            // 忽略极少数情况下的对象未就绪错误
        }
    }
    
    // ============================
    // 8. 光标归位
    // ============================
    Selection.HomeKey(wdStory);
}



function 分析排版()
{
    // ============================
    // 1. 页面设置
    // ============================
    with (ActiveDocument.PageSetup) {
        TopMargin = 104.881050;    // 3.7cm
        BottomMargin = 104.881050; // 3.7cm
        LeftMargin = 79.369446;    // 2.8cm
        RightMargin = 79.369446;   // 2.8cm
        HeaderDistance = 56.692001; // 页眉距边界 2cm
        FooterDistance = 56.692001; // 页脚距边界 2cm
    }

    // ============================
    // 2. 清理文本：标点转换 & 删除空格
    // ============================
    var puncMap = [
        [",", "，"], [".", "。"], [";", "；"], [":", "："],
        ["?", "？"], ["!", "！"], ["(", "（"], [")", "）"],
        [" ", ""],                    // 删除半角空格
        [String.fromCharCode(12288), ""] // 删除全角空格
    ];
    
    var findObj = ActiveDocument.Content.Find;
    for (var i = 0; i < puncMap.length; i++) {
        findObj.Execute(puncMap[i][0], false, false, false, false, false, true, wdFindContinue, false, puncMap[i][1], wdReplaceAll);
    }

    // ============================
    // 3. 删除所有空行
    // ============================
    var paras = ActiveDocument.Paragraphs;
    for (var i = paras.Count; i >= 1; i--) {
        var para = paras.Item(i);
        var txt = para.Range.Text;
        var cleanedText = txt.replace(/[\r\v]/g, "");
        
        if (cleanedText.length === 0) {
            para.Range.Delete();
        }
    }

    // ============================
    // 4. 全文基础格式设置
    // ============================
    Selection.WholeStory();
    
    with (Selection.ParagraphFormat) {
        CharacterUnitFirstLineIndent = 2; // 首行缩进2字符
        FirstLineIndent = 0;
        LineSpacingRule = wdLineSpaceExactly;
        LineSpacing = 17; // 固定行距17磅
        LineUnitBefore = 1; // 段前1行
        LineUnitAfter = 1;  // 段后1行

        AutoAdjustRightIndent = false; 
        SnapToGrid = false;           
    }

    with (Selection.Font) {
        Size = 12; // 小四号
        NameFarEast = "宋体";
        NameAscii = "Times New Roman";
        NameOther = "Times New Roman";
    }

    // ============================
    // 5. 大标题格式设置 (第一段)
    // ============================
    if (ActiveDocument.Paragraphs.Count > 0) {
        var titleRange = ActiveDocument.Paragraphs.Item(1).Range;
        
        with (titleRange.Font) {
            Name = "宋体";
            NameFarEast = "宋体";
            Size = 12; 
            SizeBi = 12;
            Bold = true; // 加粗
        }

        with (titleRange.ParagraphFormat) {
            Alignment = wdAlignParagraphCenter;
            CharacterUnitFirstLineIndent = 0;
            FirstLineIndent = 0;
            
            // 【调整】标题间距设为0，避免标题上方空行过大
            LineUnitBefore = 0;
            LineUnitAfter = 0;
            
            AutoAdjustRightIndent = false;
            SnapToGrid = false;
        }
    }

    // ============================
    // 6. 一级标题加粗
    // ============================
    var regex = /^[一二三四五六七八九十百]+、/;
    for (var i = 2; i <= ActiveDocument.Paragraphs.Count; i++) {
        var para = ActiveDocument.Paragraphs.Item(i);
        var txt = para.Range.Text;
        
        if (regex.test(txt)) {
            para.Range.Font.Bold = true;
            // 一级标题会自动继承正文的“段前1行，段后1行”，通常无需额外调整
        }
    }

    // ============================
    // 7. 段后插入空行 (保留原有逻辑)
    // ============================
   /* var totalParagraphs = ActiveDocument.Paragraphs.Count;
    // 从倒数第一段遍历到第二段（跳过大标题）
    for (var i = totalParagraphs; i >= 2; i--) {
        var para = ActiveDocument.Paragraphs.Item(i);
        var rng = para.Range;
        rng.Collapse(wdCollapseEnd);
        rng.InsertParagraphAfter();
    }*/
    
    // ============================
    // 8. 光标归位
    // ============================
    Selection.HomeKey(wdStory);
}

```
### （三）日常使用。
打开你需要调格式的文档（如过弹出“安全警告：宏已经被禁用”，则点一下启用宏），点运行宏，选信息排版或分析排版，点运行即可。


# 三、在内网环境下安装新版WPS
### （一）版本。
wps-office_12.1.2.24722.AK.preread.sw_612444_arm64.deb
### （二）卸载。
桌面右键终端，输入：sudo dpkg -P wps-office
### （三）安装。
将安装包放置到桌面，双击安装，安装最后会失败不要担心。桌面右键选终端，输入：sudo apt-get install --reinstall caja
