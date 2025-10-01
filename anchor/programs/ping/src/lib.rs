#![allow(unexpected_cfgs)]
#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("5VvH7jtmarcgTuW1nT58GjPFhqoNPxGRbKcxWB68pm34");

#[program]
pub mod ping {
    use super::*;

    pub fn close(_ctx: Context<ClosePing>) -> Result<()> {
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.ping.count = ctx.accounts.ping.count.checked_sub(1).unwrap();
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.ping.count = ctx.accounts.ping.count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn initialize(_ctx: Context<InitializePing>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
        ctx.accounts.ping.count = value.clone();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePing<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  init,
  space = 8 + Ping::INIT_SPACE,
  payer = payer
    )]
    pub ping: Account<'info, Ping>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct ClosePing<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  mut,
  close = payer, // close account and return lamports to payer
    )]
    pub ping: Account<'info, Ping>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub ping: Account<'info, Ping>,
}

#[account]
#[derive(InitSpace)]
pub struct Ping {
    count: u8,
}
