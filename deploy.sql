CREATE TABLE jbrowse_usage (
       id serial primary key,
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

       reportTime timestamp,

       loadTime real,

       remoteAddr varchar(15),
       userAgent text,

       referer text,

       acceptLanguage varchar(30),

       acceptCharset varchar(30),

       host text
);


