*** Settings ***

Library    Process
Library    String
Suite Setup    Start Remote Server
Suite Teardown    Stop Remote Server

*** Variables ***

${HOST}    localhost
${PORT}    8270

*** Test Cases ***

Run Synchronous Keyword Without Return Value And No Arguments
    ${result}=    Do Nothing
    Should Be Equal    ${result}    ${EMPTY}

Run Synchronous Keyword With Return Value And Multiple Arguments
    ${result}=    Concatenate Arguments    Bau    Miao
    Should Be Equal    ${result}    BauMiao

Run Synchronous Keyword With Return Value And Variable Arguments
    ${result}=    Concatenate Arguments With Var Arguments    prefix   One  Two
    Should Be Equal    ${result}    prefix["One","Two"]

Run Synchronous Keyword With Return Value And Named Arguments
    ${result}=    Concatenate Arguments With Named Arguments    prefix   a=1   b=${2}
    Should Be Equal    ${result}    prefix{"a":"1","b":2}

Run Synchronous Keyword With Return Value And Both Named and Variable Arguments
    ${result}=    Concatenate Arguments With Var And Named Arguments    prefix   One    Two   a=1   b=${2}
    Should Be Equal    ${result}    prefix["One","Two",{"a":"1","b":2}]

Run Synchronous Failing Keyword
    Run Keyword And Expect Error    Error    Just Fail

Run Asynchronous Keyword Without Return Value And No Arguments
    ${result}=    Do Nothing Async
    Should Be Equal    ${result}    ${EMPTY}

Run Asynchronous Keyword With Return Value And Multiple Arguments
    ${result}=    Concatenate Arguments Async    Bau    Miao
    Should Be Equal    ${result}    BauMiao

Run Asynchronous Keyword With Return Value And Variable Arguments
    ${result}=    Concatenate Arguments With Var Arguments Async    prefix   One  Two
    Should Be Equal    ${result}    prefix["One","Two"]

Run Aynchronous Keyword With Return Value And Named Arguments
    ${result}=    Concatenate Arguments With Named Arguments Async    prefix   a=1   b=${2}
    Should Be Equal    ${result}    prefix{"a":"1","b":2}

Run Asynchronous Keyword With Return Value And Both Named and Variable Arguments
    ${result}=    Concatenate Arguments With Var And Named Arguments Async    prefix   One    Two   a=1   b=${2}
    Should Be Equal    ${result}    prefix["One","Two",{"a":"1","b":2}]

Run Asynchronous Failing Keyword
    Run Keyword And Expect Error    Error    Just Fail Async

Never Returning Keyword Should Fail After Timeout
    Run Keyword And Expect Error    Error: Keyword execution got timeout    Never Return

*** Keywords ***

Start Remote Server
    ${remote}=    Start Process    node    ./test/testlibrary.js    ${HOST}    ${PORT}
    Sleep    1s
    Process Should Be Running    ${remote}
    Import Library    Remote    http://${HOST}:${PORT}

