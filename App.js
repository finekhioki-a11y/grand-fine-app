// App.js
console.log("グランドファイン豊中 客室案内アプリが読み込まれました");

// 今後の拡張（ボタンを押した時のログなど）用
document.querySelectorAll('a').forEach(button => {
    button.addEventListener('click', () => {
        console.log("客室ページへ遷移します");
    });
});
