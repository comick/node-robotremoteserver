*** Settings ***

Library    Process
Library    String

*** Variables ***

${HOST}    localhost
${PORT}    8270

*** Test Cases ***

Start Remote Server
    ${remote}=    Start Process    node    ./test/testlibrary.js    ${HOST}    ${PORT}
    Sleep    1s
    Process Should Be Running    ${remote}
    Import Library    Remote    http://${HOST}:${PORT}

Run Synchronous Keyword Without Return Value And No Arguments
    ${result}=    Do Nothing
    Should Be Equal    ${result}    ${EMPTY}

Run Synchronous Keyword With Return Value And Multiple Arguments
    ${result}=    Concatenate Arguments    Bau    Miao
    Should Be Equal    ${result}    BauMiao

Run Synchronous Failing Keyword
    Run Keyword And Expect Error    AssertionError: false == true    Just Fail

Run Asynchronous Keyword Without Return Value And No Arguments
    ${result}=    Do Nothing Async
    Should Be Equal    ${result}    ${EMPTY}

Run Asynchronous Keyword With Return Value And Multiple Arguments
    ${result}=    Concatenate Arguments Async    Bau    Miao
    Should Be Equal    ${result}    BauMiao

Run Asynchronous Failing Keyword
    Run Keyword And Expect Error    AssertionError: false == true    Just Fail Async

Never Returning Keyword Should Fail After Timeout
    Run Keyword And Expect Error    Error: Keyword execution got timeout    Never Return

Shutdown Remote Server
    Stop Remote Server


