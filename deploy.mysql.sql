CREATE TABLE jbrowse_client_log (
       id int PRIMARY KEY AUTO_INCREMENT,
       refseqCount int,
       refseqAvgLen real,

       trackCount int,
       trackTypes text,

       screenHeight int,
       screenWidth int,

       windowHeight int,
       windowWidth int,

       elHeight int,
       elWidth int,

       reportTime int,

       loadTime real,

       clientAddr varchar(15),

       userAgent text,

       uaFamily varchar(15),
       uaMajor varchar(4),
       uaMinor varchar(5),
       uaPatch varchar(10),
       os      varchar(15),

       referer text,

       acceptLanguage varchar(30),

       acceptCharset varchar(30),

       host text
);


