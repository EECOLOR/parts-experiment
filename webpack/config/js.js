module.exports = () => ({
  loaders: [
    {
      loader: 'babel-loader',
      options: { presets: ['@babel/preset-env', '@babel/preset-react'] }
    }
  ]
})
