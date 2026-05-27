" ctok.nvim - plugin entry point
" Neovim 0.10+ required (vim.system API)

if exists('g:loaded_ctok') | finish | endif
let g:loaded_ctok = 1

if !has('nvim-0.10')
  echohl WarningMsg
  echomsg '[ctok] Neovim 0.10 or later is required.'
  echohl None
  finish
endif

" Auto-setup with defaults when the user has not called setup() explicitly.
" This ensures commands are available even without an explicit require('ctok').setup().
lua require('ctok').setup()
