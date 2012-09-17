﻿// Autogenerated by hob
window.cls || (window.cls = {});
cls.ResourceManager || (cls.ResourceManager = {});
cls.ResourceManager["1.2"] || (cls.ResourceManager["1.2"] = {});

cls.ResourceManager["1.2"].UrlLoad = function(arr)
{
  this.windowID = arr[0];
  this.frameID = arr[1];
  this.documentID = arr[2];
  this.resourceID = arr[3];
  /**
    *
    *  The URL which which is about to be loaded.
    */
  this.url = arr[4];
  /**
    *
    *  The type of URL that was started, this can referer to a specific protocol
    *  or a special URL type.
    *
    *  @note More types may be added in the future, make sure the client supports that.
    */
  // cls.ResourceManager["1.2"].UrlLoad.URLType
  this.urlType = arr[5];
  /**
    *
    *  Milliseconds since Unix epoch.
    */
  this.time = arr[6];
  /**
    *
    *  This field may be set to provide additional information about the
    *  origin of a URL load.
    *
    *  If the field is not set, the origin is unknown.
    *
    *  @since 1.2
    */
  // cls.ResourceManager["1.2"].LoadOrigin
  this.loadOrigin = arr[7];
};
cls.ResourceManager["1.2"].UrlLoad.URLType =
{
  /**
    *
    *  Type not known, should not occur.
    */
  0: "UNKNOWN",
  /**
    *
    *  HTTP protocol.
    */
  1: "HTTP",
  /**
    *
    *  HTTP protocol with SSL.
    */
  2: "HTTPS",
  /**
    *
    *  Local file access.
    */
  3: "FILE",
  /**
    *
    *  Data URIs, e.g data:text/plain,mydata
    */
  4: "DATA",
  5: "FTP",
  6: "GOPHER",
  7: "WAIS",
  8: "NEWS",
  9: "SNEWS",
  10: "NEWSATTACHMENT",
  11: "SNEWSATTACHMENT",
  12: "EMAIL",
  13: "ATTACHMENT",
  14: "TELNET",
  15: "MAILTO",
  16: "OPERA",
  17: "JAVASCRIPT",
  18: "CONTENT_ID",
  19: "TN3270",
  21: "SOURCE",
  22: "CLIENT",
  23: "NNTP",
  25: "NNTPS",
  26: "SHARE",
  27: "GHTTP",
  28: "TV",
  29: "EDITED",
  30: "ERROR",
  31: "DVB",
  32: "TEL",
  33: "MAIL",
  34: "IRC",
  35: "SMS",
  36: "SMSTO",
  39: "CHAT_TRANSFER",
  40: "DEVICE",
  41: "MOUNTPOINT",
  42: "WIDGET",
  43: "OBMLSERVER",
  44: "UNITE",
  100: "INTERNAL",
};
/**
  *
  *  Type not known, should not occur.
  */
cls.ResourceManager["1.2"].UrlLoad.URLType.UNKNOWN = 0;
/**
  *
  *  HTTP protocol.
  */
cls.ResourceManager["1.2"].UrlLoad.URLType.HTTP = 1;
/**
  *
  *  HTTP protocol with SSL.
  */
cls.ResourceManager["1.2"].UrlLoad.URLType.HTTPS = 2;
/**
  *
  *  Local file access.
  */
cls.ResourceManager["1.2"].UrlLoad.URLType.FILE = 3;
/**
  *
  *  Data URIs, e.g data:text/plain,mydata
  */
cls.ResourceManager["1.2"].UrlLoad.URLType.DATA = 4;
cls.ResourceManager["1.2"].UrlLoad.URLType.FTP = 5;
cls.ResourceManager["1.2"].UrlLoad.URLType.GOPHER = 6;
cls.ResourceManager["1.2"].UrlLoad.URLType.WAIS = 7;
cls.ResourceManager["1.2"].UrlLoad.URLType.NEWS = 8;
cls.ResourceManager["1.2"].UrlLoad.URLType.SNEWS = 9;
cls.ResourceManager["1.2"].UrlLoad.URLType.NEWSATTACHMENT = 10;
cls.ResourceManager["1.2"].UrlLoad.URLType.SNEWSATTACHMENT = 11;
cls.ResourceManager["1.2"].UrlLoad.URLType.EMAIL = 12;
cls.ResourceManager["1.2"].UrlLoad.URLType.ATTACHMENT = 13;
cls.ResourceManager["1.2"].UrlLoad.URLType.TELNET = 14;
cls.ResourceManager["1.2"].UrlLoad.URLType.MAILTO = 15;
cls.ResourceManager["1.2"].UrlLoad.URLType.OPERA = 16;
cls.ResourceManager["1.2"].UrlLoad.URLType.JAVASCRIPT = 17;
cls.ResourceManager["1.2"].UrlLoad.URLType.CONTENT_ID = 18;
cls.ResourceManager["1.2"].UrlLoad.URLType.TN3270 = 19;
cls.ResourceManager["1.2"].UrlLoad.URLType.SOURCE = 21;
cls.ResourceManager["1.2"].UrlLoad.URLType.CLIENT = 22;
cls.ResourceManager["1.2"].UrlLoad.URLType.NNTP = 23;
cls.ResourceManager["1.2"].UrlLoad.URLType.NNTPS = 25;
cls.ResourceManager["1.2"].UrlLoad.URLType.SHARE = 26;
cls.ResourceManager["1.2"].UrlLoad.URLType.GHTTP = 27;
cls.ResourceManager["1.2"].UrlLoad.URLType.TV = 28;
cls.ResourceManager["1.2"].UrlLoad.URLType.EDITED = 29;
cls.ResourceManager["1.2"].UrlLoad.URLType.ERROR = 30;
cls.ResourceManager["1.2"].UrlLoad.URLType.DVB = 31;
cls.ResourceManager["1.2"].UrlLoad.URLType.TEL = 32;
cls.ResourceManager["1.2"].UrlLoad.URLType.MAIL = 33;
cls.ResourceManager["1.2"].UrlLoad.URLType.IRC = 34;
cls.ResourceManager["1.2"].UrlLoad.URLType.SMS = 35;
cls.ResourceManager["1.2"].UrlLoad.URLType.SMSTO = 36;
cls.ResourceManager["1.2"].UrlLoad.URLType.CHAT_TRANSFER = 39;
cls.ResourceManager["1.2"].UrlLoad.URLType.DEVICE = 40;
cls.ResourceManager["1.2"].UrlLoad.URLType.MOUNTPOINT = 41;
cls.ResourceManager["1.2"].UrlLoad.URLType.WIDGET = 42;
cls.ResourceManager["1.2"].UrlLoad.URLType.OBMLSERVER = 43;
cls.ResourceManager["1.2"].UrlLoad.URLType.UNITE = 44;
cls.ResourceManager["1.2"].UrlLoad.URLType.INTERNAL = 100;

/**
  *
  *  Indicates in which context a resource was needed.
  *
  *  @since 1.2
  */
cls.ResourceManager["1.2"].LoadOrigin =
{
  /**
    *
    *  The resource was requested by XMLHttpRequest.
    */
  1: "XHR",
};
/**
  *
  *  The resource was requested by XMLHttpRequest.
  */
cls.ResourceManager["1.2"].LoadOrigin.XHR = 1;

