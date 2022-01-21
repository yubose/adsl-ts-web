## Steps

## onPreInit

1. plugin options:
   1. config key
      1. check if options.path exists
         - if exist
           1. read config file
           2. read app key
           3. fetch preload pages + app pages
              - save to output path
         - else
           1. fetch remotely
           2. read app key
           3. fetch preload pages + app pages
              - save to output path
2. save config version
3. parse/save assetsUrl
4. parse/save cadlBaseUrl
5. parse/save configKey
6. parse/save appKey
7.
